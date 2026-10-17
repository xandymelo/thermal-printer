/** `tearing`: impressão terminou e o papel está sendo rasgado (animação antes de `done`).
 *  `offline`: a impressora foi aposentada; o site virou só o arquivo das fotos. */
export type PrintStatus = 'idle' | 'printing' | 'tearing' | 'done' | 'error' | 'offline';
export const ART_STYLES = [
  'ascii', 'dots', 'linhas', 'blocos', 'meio-tom', 'retrô', 'duplo', 'hash', 'cantos', 'pontilhado', 'sombra',
] as const;
export type ArtStyle = (typeof ART_STYLES)[number];

/** Largura do papel de 58mm, em colunas. */
export const PAPER_COLUMNS = 32;
const MIN_ROWS = 4;
const ART_WIDTH = 48;
const SCREEN_WIDTH = 38;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Centraliza `s` numa largura fixa, cortando o excesso. */
const center = (s: string, width: number) => {
  const left = Math.max(0, Math.floor((width - s.length) / 2));
  return (' '.repeat(left) + s).padEnd(width).slice(0, width);
};

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

export function ticketNumber(date: Date): string {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 864e5);
  return '#' + String(dayOfYear).padStart(4, '0');
}

export function formatTicketDate(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${String(date.getFullYear()).slice(2)}`;
}

export function nextMidnight(from = new Date()): number {
  const d = new Date(from);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/** Linhas que o texto ocupa no papel, quebrando a cada 32 colunas. */
export function countRows(text: string): number {
  const rows = text.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / PAPER_COLUMNS)), 0);
  return Math.max(MIN_ROWS, rows);
}

function screenLines(status: PrintStatus, tick: number, remainingMs: number): [string, string] {
  switch (status) {
    case 'printing': {
      const n = tick % 9;
      return ['imprimindo', '[' + '#'.repeat(n * 2) + '.'.repeat(16 - n * 2) + ']'];
    }
    case 'tearing':
      return ['rasgando...', ''];
    case 'done':
      return ['impresso. obrigado.', 'proxima em ' + formatCountdown(remainingMs)];
    case 'error':
      return ['sem papel?', 'tente de novo'];
    case 'offline':
      return ['offline.', 'obrigado pelas mensagens'];
    default:
      return ['pronta', '1 impressao disponivel hoje'];
  }
}

export interface PrinterArtInput {
  status: PrintStatus;
  tick: number;
  remainingMs: number;
  style: ArtStyle;
}

/** O que muda entre estilos: as duas linhas da tela e o LED já desenhado. Todos têm 12 linhas de
 *  48 colunas, menos o `sombra`, que soma a sombra: 13 de 50. */
interface Screen {
  l1: string;
  l2: string;
  led: string;
}

interface Drawing {
  /** Glifo do LED, 3 colunas. Aceso, ele também fica vermelho (ver `ledOn`). */
  led: (on: boolean) => string;
  draw: (s: Screen) => string[];
}

const r = (ch: string, n: number) => ch.repeat(n);
const full = (s: string) => center(s, ART_WIDTH);
const dot = (s: string) => s.replace(/[^ ]/g, '·');
/** Marca onde o LED entra, para separá-lo do resto do desenho. */
const LED_MARK = '\u0000\u0000\u0000';

const ASCII: Drawing = {
    led: () => '(o)',
    draw: ({ l1, l2, led }) => [
      full(r('_', 42)), full('/  [' + r('=', 36) + ']  \\'), full('/' + r(' ', 44) + '\\'), '|' + r(' ', 46) + '|',
      '|   .' + r('-', 38) + '.   |', '|   |' + center(l1, SCREEN_WIDTH) + '|   |', '|   |' + center(l2, SCREEN_WIDTH) + '|   |', "|   '" + r('-', 38) + "'   |",
      '|' + r(' ', 46) + '|', '|  ||||||' + r(' ', 30) + led + '     |', '|' + r('_', 46) + '|', " '" + r('-', 44) + "' ",
    ],
  };

const DRAWINGS: Record<ArtStyle, Drawing> = {
  ascii: ASCII,
  // O mesmo desenho do ascii com a moldura pontilhada; a tela e o LED aceso continuam legíveis.
  dots: {
    led: on => (on ? '(o)' : dot('(o)')),
    draw: ({ l1, l2, led }) => [
      dot(full(r('_', 42))), dot(full('/  [' + r('=', 36) + ']  \\')), dot(full('/' + r(' ', 44) + '\\')), dot('|' + r(' ', 46) + '|'),
      dot('|   .' + r('-', 38) + '.   |'), dot('|   |') + center(l1, SCREEN_WIDTH) + dot('|   |'), dot('|   |') + center(l2, SCREEN_WIDTH) + dot('|   |'), dot("|   '" + r('-', 38) + "'   |"),
      dot('|' + r(' ', 46) + '|'), dot('|  ||||||' + r(' ', 30)) + led + dot('     |'), dot('|' + r('_', 46) + '|'), dot(" '" + r('-', 44) + "' "),
    ],
  },
  linhas: {
    led: on => (on ? ' ● ' : ' ○ '),
    draw: ({ l1, l2, led }) => [
      full('╭' + r('─', 40) + '╮'), full('│ ╘' + r('═', 36) + '╛ │'), full('╭┴' + r('─', 40) + '┴╮'), '╭─┘' + r(' ', 42) + '└─╮',
      '│   ┌' + r('─', 38) + '┐   │', '│   │' + center(l1, SCREEN_WIDTH) + '│   │', '│   │' + center(l2, SCREEN_WIDTH) + '│   │', '│   └' + r('─', 38) + '┘   │',
      '│' + r(' ', 46) + '│', '│  ┃┃┃┃┃┃' + r(' ', 30) + led + '     │', '╰' + r('─', 46) + '╯', r(' ', 48),
    ],
  },
  blocos: {
    led: () => ' o ',
    draw: ({ l1, l2, led }) => [
      full(r('▄', 42)), full('██▐' + r('▀', 36) + '▌██'), full('▄' + r('█', 44) + '▄'), r('█', 48),
      r('█', 5) + r(' ', 38) + r('█', 5), r('█', 5) + center(l1, SCREEN_WIDTH) + r('█', 5), r('█', 5) + center(l2, SCREEN_WIDTH) + r('█', 5), r('█', 5) + r(' ', 38) + r('█', 5),
      r('█', 48), '██ ▌▌▌▌▌▌ ' + r('█', 30) + led + r('█', 5), r('█', 48), ' ' + r('▀', 46) + ' ',
    ],
  },
  'meio-tom': {
    led: () => '(o)',
    draw: ({ l1, l2, led }) => [
      full(r('░', 42)), full('▒▒[' + r('=', 36) + ']▒▒'), full('░' + r('▒', 44) + '░'), '░' + r('▓', 46) + '░',
      '░▓▓▓ ' + r(' ', 38) + ' ▓▓▓░', '░▓▓▓ ' + center(l1, SCREEN_WIDTH) + ' ▓▓▓░', '░▓▓▓ ' + center(l2, SCREEN_WIDTH) + ' ▓▓▓░', '░▓▓▓ ' + r(' ', 38) + ' ▓▓▓░',
      '░' + r('▓', 46) + '░', '░▓ ║║║║║║ ' + r('▓', 30) + led + '▓▓▓▓░', '░' + r('▒', 46) + '░', ' ' + r('░', 46) + ' ',
    ],
  },
  'retrô': {
    led: () => '(o)',
    draw: ({ l1, l2, led }) => [
      full(r('_', 42)), full(".-'[" + r('=', 36) + "]'-."), full(".'" + r(' ', 42) + "'."), '/' + r(' ', 46) + '\\',
      '|     ' + r('_', 36) + '     |', '|    |' + center(l1, 36) + '|    |', '|    |' + center(l2, 36) + '|    |', '|    |' + r('_', 36) + '|    |',
      '|' + r(' ', 46) + '|', '|  //////' + r(' ', 30) + led + '     |', '\\' + r('_', 46) + '/', " '" + r('-', 44) + "' ",
    ],
  },
  duplo: {
    led: on => (on ? ' ● ' : ' ○ '),
    draw: ({ l1, l2, led }) => [
      full('╔' + r('═', 40) + '╗'), full('║ ╚' + r('═', 36) + '╝ ║'), full('╔╩' + r('═', 40) + '╩╗'), '╔═╝' + r(' ', 42) + '╚═╗',
      '║   ╔' + r('═', 38) + '╗   ║', '║   ║' + center(l1, SCREEN_WIDTH) + '║   ║', '║   ║' + center(l2, SCREEN_WIDTH) + '║   ║', '║   ╚' + r('═', 38) + '╝   ║',
      '║' + r(' ', 46) + '║', '║  ││││││' + r(' ', 30) + led + '     ║', '╚' + r('═', 46) + '╝', r(' ', 48),
    ],
  },
  hash: {
    led: () => ' o ',
    draw: ({ l1, l2, led }) => [
      full(r('#', 42)), full('## ' + r('-', 36) + ' ##'), full(r('#', 46)), r('#', 48),
      '#### ' + r(' ', 38) + ' ####', '#### ' + center(l1, SCREEN_WIDTH) + ' ####', '#### ' + center(l2, SCREEN_WIDTH) + ' ####', '#### ' + r(' ', 38) + ' ####',
      r('#', 48), '##  | | | ' + r('#', 30) + led + r('#', 5), r('#', 48), ' ' + r("'", 46) + ' ',
    ],
  },
  cantos: {
    led: () => '(o)',
    draw: ({ l1, l2, led }) => [
      full('+' + r('-', 40) + '+'), full('| [' + r('_', 36) + '] |'), '+' + r('-', 46) + '+', '|' + r(' ', 46) + '|',
      '|   +' + r('-', 38) + '+   |', '|   |' + center(l1, SCREEN_WIDTH) + '|   |', '|   |' + center(l2, SCREEN_WIDTH) + '|   |', '|   +' + r('-', 38) + '+   |',
      '|' + r(' ', 46) + '|', '|  [::::]' + r(' ', 30) + led + '     |', '+' + r('-', 46) + '+', full('+-+' + r(' ', 38) + '+-+'),
    ],
  },
  pontilhado: {
    led: () => ' o ',
    draw: ({ l1, l2, led }) => [
      full(r('.', 42)), full(': [' + r(':', 36) + '] :'), full('.:' + r(' ', 42) + ':.'), ':' + r(' ', 46) + ':',
      ':   ' + r('.', 40) + '   :', ':   :' + center(l1, SCREEN_WIDTH) + ':   :', ':   :' + center(l2, SCREEN_WIDTH) + ':   :', ':   ' + r("'", 40) + '   :',
      ':' + r(' ', 46) + ':', ':  ::::::' + r(' ', 30) + led + '     :', ':' + r('.', 46) + ':', ' ' + r("'", 46) + ' ',
    ],
  },
  // O ascii com sombra projetada à direita e embaixo — por isso é o único com 13×50.
  sombra: {
    led: () => '(o)',
    draw: screen => [
      ...ASCII.draw(screen).map((row, i) => ' ' + row + (i >= 2 ? '░' : ' ')),
      '  ' + r('░', 47) + ' ',
    ],
  },
};

export interface PrinterArtParts {
  before: string;
  led: string;
  after: string;
  /** LED aceso: pisca a cada tick durante a impressão — a tela pinta de vermelho. */
  ledOn: boolean;
}

/** O desenho partido em volta do LED, para a tela poder colorir só ele. */
export function printerArtParts({ status, tick, remainingMs, style }: PrinterArtInput): PrinterArtParts {
  const [l1, l2] = screenLines(status, tick, remainingMs);
  const ledOn = status === 'printing' && tick % 2 === 1;
  const drawing = DRAWINGS[style] ?? DRAWINGS.ascii;
  const [before, after] = drawing.draw({ l1, l2, led: LED_MARK }).join('\n').split(LED_MARK);
  return { before, led: drawing.led(ledOn), after, ledOn };
}

export function renderPrinterArt(input: PrinterArtInput): string {
  const { before, led, after } = printerArtParts(input);
  return before + led + after;
}
