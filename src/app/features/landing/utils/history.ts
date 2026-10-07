export interface HistoryEntry {
  text: string;
  handle: string;
  /** Símbolo do cabeçalho do cupom; entradas antigas (ou da API) podem não ter. */
  sym?: string;
  /** Timestamp da impressão. */
  at: number;
}

export interface HistoryCard {
  header: string;
  no: string;
  date: string;
  from: string;
  text: string;
}

export const DEFAULT_SYMBOL = '*';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Histórico vem do mais novo para o mais antigo; o número do cupom conta a partir do total. */
export function toHistoryCards(history: HistoryEntry[], limit: number): HistoryCard[] {
  return history.slice(0, limit).map((entry, i) => {
    const t = new Date(entry.at);
    const sym = entry.sym || DEFAULT_SYMBOL;
    return {
      header: `${sym} 58mm ${sym}`,
      no: '#' + String(history.length - i).padStart(4, '0'),
      date: `${pad2(t.getDate())}.${pad2(t.getMonth() + 1)}.${String(t.getFullYear()).slice(2)}  ${pad2(t.getHours())}:${pad2(t.getMinutes())}`,
      from: entry.handle ? '@' + entry.handle : 'anônimo',
      text: entry.text,
    };
  });
}
