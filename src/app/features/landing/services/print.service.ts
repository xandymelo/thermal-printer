import { Injectable, inject } from '@angular/core';
import { EMPTY, Subscription, catchError, concatMap, interval, map, of, timer } from 'rxjs';
import { PrintApi } from '../apis/print.api';
import { PRINT_CONFIG } from '../print.config';
import { PrintState } from '../states/print.state';
import { HistoryEntry } from '../utils/history';
import { ArtStyle, nextMidnight } from '../utils/printer-art';

export const PRINT_LIMIT_KEY = 'termica58_next';
export const HISTORY_KEY = 'termica58_hist';
/** Tempo da animação de impressão — o papel sobe enquanto a barra enche. */
export const PRINT_ANIMATION_MS = 2200;
const CLOCK_MS = 250;
const ERROR_RESET_MS = 3000;
const IGNORE_LIMIT_COOLDOWN_MS = 4000;
const HISTORY_MAX = 100;
const HANDLE_MAX = 24;

@Injectable()
export class PrintService {
  private api = inject(PrintApi);
  private config = inject(PRINT_CONFIG);
  readonly state = inject(PrintState);
  private clock?: Subscription;

  constructor() {
    this.state.setArtStyle(this.config.artStyle);
  }

  start(): void {
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

  setArtStyle(style: ArtStyle): void {
    this.state.setArtStyle(style);
  }

  print(): void {
    const text = this.state.text().trim();
    if (!text || this.state.status() !== 'idle') return;
    this.state.setStatus('printing');

    const request$ = this.config.endpoint
      ? this.api
          .print(this.config.endpoint, { text, handle: this.state.handle(), private: this.state.isPrivate() })
          .pipe(map(() => true))
      : of(true);

    request$
      .pipe(
        catchError(() => of(false)),
        concatMap(ok => timer(PRINT_ANIMATION_MS).pipe(map(() => ok))),
      )
      .subscribe(ok => (ok ? this.onPrinted(text) : this.onFailed()));
  }

  private onPrinted(text: string): void {
    if (!this.state.isPrivate()) {
      const entry: HistoryEntry = { text, handle: this.state.handle(), at: Date.now() };
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
    this.state.setStatus('done');
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

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* segue sem persistir */
    }
  }
}
