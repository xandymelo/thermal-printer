import { TestBed, discardPeriodicTasks, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FINGERPRINT_PROVIDER, PRINT_CONFIG, PrintConfig } from '../print.config';
import { PrintState } from '../states/print.state';
import { HISTORY_KEY, PRINT_ANIMATION_MS, PRINT_LIMIT_KEY, PrintService, TEAR_ANIMATION_MS } from './print.service';

describe('PrintService', () => {
  let service: PrintService;
  let state: PrintState;
  let http: HttpTestingController;

  const FP = 'a'.repeat(64);
  let fingerprintResult: string | null;

  const setup = (config: Partial<PrintConfig> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PrintState,
        PrintService,
        { provide: FINGERPRINT_PROVIDER, useValue: () => Promise.resolve(fingerprintResult) },
        {
          provide: PRINT_CONFIG,
          useValue: {
            endpoint: '',
            historyEndpoint: '',
            historyLimit: 5,
            showStylePicker: true,
            maxLength: 280,
            ignoreLimit: false,
            artStyle: 'ascii',
            ...config,
          } satisfies PrintConfig,
        },
      ],
    });
    service = TestBed.inject(PrintService);
    state = TestBed.inject(PrintState);
    http = TestBed.inject(HttpTestingController);
  };

  const clearStorage = () => {
    localStorage.removeItem(PRINT_LIMIT_KEY);
    localStorage.removeItem(HISTORY_KEY);
  };

  beforeEach(() => {
    clearStorage();
    fingerprintResult = FP;
  });
  afterEach(() => {
    service?.stop();
    clearStorage();
  });

  it('given a stored limit in the future, when started, then begins in done status', () => {
    localStorage.setItem(PRINT_LIMIT_KEY, String(Date.now() + 60_000));
    setup();
    service.start();
    expect(state.status()).toBe('done');
  });

  it('given an expired stored limit, when started, then begins idle', () => {
    localStorage.setItem(PRINT_LIMIT_KEY, String(Date.now() - 1000));
    setup();
    service.start();
    expect(state.status()).toBe('idle');
  });

  it('given text longer than maxLength, when typed, then it is truncated', () => {
    setup({ maxLength: 40 });
    service.setText('x'.repeat(50));
    expect(state.text().length).toBe(40);
  });

  it('given blank text, when printing, then nothing happens', () => {
    setup();
    service.setText('   ');
    service.print();
    expect(state.status()).toBe('idle');
  });

  it('given no endpoint, when printing, then animates, tears the paper and locks until midnight', fakeAsync(() => {
    setup();
    service.setText('oi');
    service.print();
    expect(state.status()).toBe('printing');
    tick(PRINT_ANIMATION_MS);
    expect(state.status()).toBe('tearing');
    expect(state.text()).toBe('oi');
    tick(TEAR_ANIMATION_MS);
    expect(state.status()).toBe('done');
    expect(state.text()).toBe('');
    expect(Number(localStorage.getItem(PRINT_LIMIT_KEY))).toBeGreaterThan(Date.now());
  }));

  it('given an endpoint, when printing, then posts the trimmed text', fakeAsync(() => {
    setup({ endpoint: '/api/print' });
    service.setText('  oi  ');
    service.print();
    flushMicrotasks();
    const req = http.expectOne('/api/print');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ text: 'oi', handle: '', symbol: '*', private: false, fingerprint: FP });
    req.flush({});
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.status()).toBe('done');
  }));

  it('given the endpoint fails, when printing, then shows error and returns to idle after 3s', fakeAsync(() => {
    setup({ endpoint: '/api/print' });
    service.setText('oi');
    service.print();
    flushMicrotasks();
    http.expectOne('/api/print').flush('fail', { status: 500, statusText: 'Server Error' });
    tick(PRINT_ANIMATION_MS);
    expect(state.status()).toBe('error');
    expect(localStorage.getItem(PRINT_LIMIT_KEY)).toBeNull();
    tick(3000);
    expect(state.status()).toBe('idle');
  }));

  it('given ignoreLimit, when the short cooldown passes, then unlocks and clears the text', fakeAsync(() => {
    setup({ ignoreLimit: true });
    service.start();
    service.setText('oi');
    service.print();
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.status()).toBe('done');
    expect(localStorage.getItem(PRINT_LIMIT_KEY)).toBeNull();
    tick(5500);
    expect(state.status()).toBe('idle');
    expect(state.text()).toBe('');
    discardPeriodicTasks();
  }));

  it('given a handle with invalid characters, when typed, then keeps only letters, digits, _ and . up to 24', () => {
    setup();
    service.setHandle('@jo ão-silva!_.' + 'x'.repeat(30));
    expect(state.handle()).toBe(('joosilva_.' + 'x'.repeat(30)).slice(0, 24));
  });

  it('given a locked printer, when toggling private, then nothing changes', fakeAsync(() => {
    setup();
    service.setText('oi');
    service.print();
    service.togglePrivate();
    expect(state.isPrivate()).toBeFalse();
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
  }));

  it('given a public print, when it succeeds, then it goes to the top of the stored history', fakeAsync(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ text: 'velha', handle: '', at: 1 }]));
    setup({ endpoint: '/api/print' });
    service.start();
    service.setHandle('eliza');
    service.setText('nova');
    service.print();
    flushMicrotasks();
    const req = http.expectOne('/api/print');
    expect(req.request.body).toEqual(jasmine.objectContaining({ text: 'nova', handle: 'eliza', symbol: '*', private: false }));
    req.flush({});
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.history().map(h => h.text)).toEqual(['nova', 'velha']);
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY)!)[0]).toEqual(jasmine.objectContaining({ text: 'nova', handle: 'eliza', sym: '*' }));
    discardPeriodicTasks();
  }));

  it('given a private print, when it succeeds, then it stays out of the history', fakeAsync(() => {
    setup();
    service.togglePrivate();
    service.setText('segredo');
    service.print();
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.history()).toEqual([]);
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  }));

  it('given 100 stored entries, when a new one is printed, then history keeps only the latest 100', fakeAsync(() => {
    const full = Array.from({ length: 100 }, (_, i) => ({ text: `m${i}`, handle: '', at: i }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(full));
    setup();
    service.start();
    service.setText('nova');
    service.print();
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.history().length).toBe(100);
    expect(state.history()[0].text).toBe('nova');
    discardPeriodicTasks();
  }));

  it('given corrupted stored history, when started, then begins with an empty history', () => {
    localStorage.setItem(HISTORY_KEY, '{not json');
    setup();
    service.start();
    expect(state.history()).toEqual([]);
  });

  it('given a history endpoint, when started, then replaces the local history with the remote one', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ text: 'local', handle: '', at: 1 }]));
    setup({ historyEndpoint: '/api/history' });
    service.start();
    http.expectOne({ method: 'GET', url: '/api/history' }).flush([{ text: 'remota', handle: 'x', at: 2 }]);
    expect(state.history().map(h => h.text)).toEqual(['remota']);
  });

  it('given the history endpoint fails, when started, then keeps the local history', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ text: 'local', handle: '', at: 1 }]));
    setup({ historyEndpoint: '/api/history' });
    service.start();
    http.expectOne('/api/history').flush('fail', { status: 500, statusText: 'Server Error' });
    expect(state.history().map(h => h.text)).toEqual(['local']);
  });

  it('given the configured style, when a new style is picked, then the state switches to it', () => {
    setup({ artStyle: 'dots' });
    expect(state.artStyle()).toBe('dots');
    service.setArtStyle('blocos');
    expect(state.artStyle()).toBe('blocos');
  });

  it('given a symbol is picked, when printing, then it goes in the request and in the history', fakeAsync(() => {
    setup({ endpoint: '/api/print' });
    service.setSymbol('✦');
    service.setText('oi');
    service.print();
    flushMicrotasks();
    const req = http.expectOne('/api/print');
    expect(req.request.body.symbol).toBe('✦');
    req.flush({});
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.history()[0].sym).toBe('✦');
  }));

  it('given a locked printer, when picking a symbol, then nothing changes', fakeAsync(() => {
    setup();
    service.setText('oi');
    service.print();
    service.setSymbol('♥');
    expect(state.symbol()).toBe('*');
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
  }));

  it('given ignoreLimit and a stored limit, when started, then clears it and begins idle', () => {
    localStorage.setItem(PRINT_LIMIT_KEY, String(Date.now() + 60_000));
    setup({ ignoreLimit: true });
    service.start();
    expect(state.status()).toBe('idle');
    expect(localStorage.getItem(PRINT_LIMIT_KEY)).toBeNull();
  });

  it('given the browser cannot compute a fingerprint, when printing, then still prints without the field', fakeAsync(() => {
    fingerprintResult = null;
    setup({ endpoint: '/api/print' });
    service.setText('oi');
    service.print();
    flushMicrotasks();
    const req = http.expectOne('/api/print');
    expect('fingerprint' in req.request.body).toBeFalse();
    req.flush({});
    tick(PRINT_ANIMATION_MS + TEAR_ANIMATION_MS);
    expect(state.status()).toBe('done');
  }));
});
