import { Injectable, inject } from '@angular/core';
import { EMPTY, Subscription, catchError, concatMap, from, interval, map, of, switchMap, timer } from 'rxjs';
import { PrintApi } from '../apis/print.api';
import { FINGERPRINT_PROVIDER, PRINT_CONFIG } from '../print.config';
import { PrintState } from '../states/print.state';
import { HistoryEntry } from '../utils/history';
import { ArtStyle, nextMidnight } from '../utils/printer-art';

export const PRINT_LIMIT_KEY = 'termica58_next';
export const HISTORY_KEY = 'termica58_hist';
/** Tempo da animação de impressão — o papel sobe enquanto a barra enche. */
export const PRINT_ANIMATION_MS = 2200;
/** Tempo do papel rasgando e voando antes de sumir (casa com a transition de 0.9s do CSS). */
export const TEAR_ANIMATION_MS = 950;
export const SYMBOLS = ['*', '✦', '♥', '☺', '♪', '✿', '☼', '◆', '☾', '#'] as const;
const CLOCK_MS = 250;
const ERROR_RESET_MS = 3000;
const IGNORE_LIMIT_COOLDOWN_MS = 5000;
const HISTORY_MAX = 100;
const HANDLE_MAX = 24;

@Injectable()
export class PrintService {
  private api = inject(PrintApi);
  private config = inject(PRINT_CONFIG);
  private fingerprint = inject(FINGERPRINT_PROVIDER);
  readonly state = inject(PrintState);
  private clock?: Subscription;

  constructor() {
    this.state.setArtStyle(this.config.artStyle);
  }

  start(): void {
    if (this.config.ignoreLimit) this.removeStorage(PRINT_LIMIT_KEY);
    const next = this.readLimit();
    if (next && next > Date.now()) {
      this.state.setNext(next);
      this.state.setStatus('done');
    }
    this.loadHistory();
    this.clock = interval(CLOCK_MS).subscribe(() => this.onClock());
  }

  stop(): void {
    this.clock?.unsubscribe();
  }

  setText(text: string): void {
    this.state.setText(text.slice(0, this.config.maxLength));
  }

  setHandle(handle: string): void {
    this.state.setHandle(handle.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, HANDLE_MAX));
  }

  togglePrivate(): void {
    if (this.state.status() !== 'idle') return;
    this.state.setPrivate(!this.state.isPrivate());
  }

  setSymbol(symbol: string): void {
    if (this.state.status() !== 'idle') return;
    this.state.setSymbol(symbol);
  }

  setArtStyle(style: ArtStyle): void {
    this.state.setArtStyle(style);
  }

  print(): void {
    const text = this.state.text().trim();
    if (!text || this.state.status() !== 'idle') return;
    this.state.setStatus('printing');

    const request$ = this.config.endpoint ? this.sendPrint(this.config.endpoint, text) : of(true);

    request$
      .pipe(
        catchError(() => of(false)),
        concatMap(ok => timer(PRINT_ANIMATION_MS).pipe(map(() => ok))),
      )
      .subscribe(ok => (ok ? this.onPrinted(text) : this.onFailed()));
  }

  /** Calcula o fingerprint só na hora de imprimir (clique do usuário), nunca durante a renderização. */
  private sendPrint(endpoint: string, text: string) {
    return from(this.fingerprint()).pipe(
      catchError(() => of(null)),
      switchMap(fingerprint =>
        this.api.print(endpoint, {
          text,
          handle: this.state.handle(),
          symbol: this.state.symbol(),
          private: this.state.isPrivate(),
          ...(fingerprint ? { fingerprint } : {}),
        }),
      ),
      map(() => true),
    );
  }

  private onPrinted(text: string): void {
    if (!this.state.isPrivate()) {
      const entry: HistoryEntry = { text, handle: this.state.handle(), sym: this.state.symbol(), at: Date.now() };
      const history = [entry, ...this.state.history()].slice(0, HISTORY_MAX);
      this.state.setHistory(history);
      this.writeStorage(HISTORY_KEY, JSON.stringify(history));
    }
    if (this.config.ignoreLimit) {
      this.state.setNext(Date.now() + IGNORE_LIMIT_COOLDOWN_MS);
    } else {
      const next = nextMidnight();
      this.writeStorage(PRINT_LIMIT_KEY, String(next));
      this.state.setNext(next);
    }
    this.state.setStatus('tearing');
    timer(TEAR_ANIMATION_MS).subscribe(() => {
      this.state.setStatus('done');
      this.state.setText('');
    });
  }

  /** Mostra o histórico local na hora; se houver endpoint, a versão remota substitui quando chegar. */
  private loadHistory(): void {
    this.state.setHistory(this.readHistory());
    if (!this.config.historyEndpoint) return;
    this.api
      .getHistory(this.config.historyEndpoint)
      .pipe(catchError(() => EMPTY))
      .subscribe(history => {
        if (Array.isArray(history)) this.state.setHistory(history);
      });
  }

  private onFailed(): void {
    this.state.setStatus('error');
    timer(ERROR_RESET_MS).subscribe(() => this.state.setStatus('idle'));
  }

  private onClock(): void {
    const now = Date.now();
    this.state.advanceClock(now);
    const next = this.state.next();
    if (this.state.status() === 'done' && next && now >= next) {
      this.state.setStatus('idle');
      this.state.setNext(null);
      this.state.setText('');
    }
  }

  // localStorage pode lançar (modo privado, storage bloqueado): sem ele os dados só não persistem.
  private readLimit(): number | null {
    try {
      return Number(localStorage.getItem(PRINT_LIMIT_KEY)) || null;
    } catch {
      return null;
    }
  }

  private readHistory(): HistoryEntry[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nada a limpar */
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* segue sem persistir */
    }
  }
}
