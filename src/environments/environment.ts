export const environment = {
  production: false,
  /** URL que recebe `POST { text }`. Vazio = só simula a impressão (útil em dev). */
  printEndpoint: '',
  /** URL que devolve o histórico (GET). Vazio = histórico só deste navegador. */
  historyEndpoint: '',
  /** Dev: libera nova impressão após 4s em vez de esperar a meia-noite. */
  ignorePrintLimit: false,
};
