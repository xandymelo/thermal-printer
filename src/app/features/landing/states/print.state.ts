import { Injectable, signal } from '@angular/core';
import { DEFAULT_SYMBOL, HistoryEntry } from '../utils/history';
import { ArtStyle, PrintStatus } from '../utils/printer-art';

@Injectable()
export class PrintState {
  private _text = signal('');
  private _handle = signal('');
  private _isPrivate = signal(false);
  private _symbol = signal(DEFAULT_SYMBOL);
  private _status = signal<PrintStatus>('idle');
  private _now = signal(Date.now());
  private _next = signal<number | null>(null);
  private _tick = signal(0);
  private _artStyle = signal<ArtStyle>('ascii');
  private _history = signal<HistoryEntry[]>([]);

  readonly text = this._text.asReadonly();
  readonly handle = this._handle.asReadonly();
  /** Mensagem privada: imprime, mas não entra no histórico. */
  readonly isPrivate = this._isPrivate.asReadonly();
  /** Símbolo que emoldura o cabeçalho do cupom (`✦ 58mm ✦`). */
  readonly symbol = this._symbol.asReadonly();
  readonly status = this._status.asReadonly();
  readonly now = this._now.asReadonly();
  /** Timestamp a partir do qual uma nova impressão é liberada. */
  readonly next = this._next.asReadonly();
  /** Contador do relógio de 250ms; move a barra de progresso e o LED. */
  readonly tick = this._tick.asReadonly();
  readonly artStyle = this._artStyle.asReadonly();
  /** Do mais novo para o mais antigo. */
  readonly history = this._history.asReadonly();

  setText(text: string) { this._text.set(text); }
  setHandle(handle: string) { this._handle.set(handle); }
  setPrivate(value: boolean) { this._isPrivate.set(value); }
  setSymbol(symbol: string) { this._symbol.set(symbol); }
  setStatus(status: PrintStatus) { this._status.set(status); }
  setNext(next: number | null) { this._next.set(next); }
  setArtStyle(style: ArtStyle) { this._artStyle.set(style); }
  setHistory(history: HistoryEntry[]) { this._history.set(history); }
  advanceClock(now: number) {
    this._now.set(now);
    this._tick.update(t => t + 1);
  }
}
