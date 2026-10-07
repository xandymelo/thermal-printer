import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ArtStyle } from './utils/printer-art';

export interface PrintConfig {
  endpoint: string;
  /** GET que devolve `HistoryEntry[]`. Vazio = histórico só do localStorage deste navegador. */
  historyEndpoint: string;
  /** Quantos cupons o carrossel mostra. */
  historyLimit: number;
  showStylePicker: boolean;
  maxLength: number;
  ignoreLimit: boolean;
  /** Estilo inicial; o visitante pode trocar pelo seletor. */
  artStyle: ArtStyle;
}

export const PRINT_CONFIG = new InjectionToken<PrintConfig>('PRINT_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    endpoint: environment.printEndpoint,
    historyEndpoint: environment.historyEndpoint,
    historyLimit: 5,
    showStylePicker: true,
    maxLength: 280,
    ignoreLimit: environment.ignorePrintLimit,
    artStyle: 'ascii',
  }),
});
