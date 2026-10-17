export interface ArchivePhoto {
  /** Caminho relativo a `public/`. */
  src: string;
  /** Cupons que aparecem na foto, do primeiro ao último. */
  receipts: string;
  date: string;
  alt: string;
}

/** Fotos dos cupons impressos enquanto a impressora esteve online (12 a 15.10.26), na ordem dos cupons. */
export const ARCHIVE_PHOTOS: ArchivePhoto[] = [
  { src: 'arquivo/01.webp', receipts: '#0004–#0028', date: '12.10.26', alt: 'colagem dos primeiros cupons impressos, no feriado' },
  { src: 'arquivo/02.webp', receipts: '#0017–#0037', date: '12–13.10.26', alt: 'colagem de cupons do primeiro e do segundo dia' },
  { src: 'arquivo/03.webp', receipts: '#0043–#0044', date: '13.10.26', alt: 'cupom com uma piada sobre o aeroporto' },
  { src: 'arquivo/04.webp', receipts: '#0045–#0050', date: '13.10.26', alt: 'colagem de cupons da noite de 13.10' },
  { src: 'arquivo/05.webp', receipts: '#0052–#0053', date: '13.10.26', alt: 'tira de cupons segurada na mão' },
  { src: 'arquivo/06.webp', receipts: '#0059', date: '14.10.26', alt: 'cupom anônimo de bom dia saindo da impressora' },
  { src: 'arquivo/07.webp', receipts: '#0060–#0063', date: '14.10.26', alt: 'tira longa de cupons da manhã de 14.10' },
  { src: 'arquivo/08.webp', receipts: '#0064–#0065', date: '14.10.26', alt: 'cupom mandando um abraço' },
  { src: 'arquivo/09.webp', receipts: '#0065–#0066', date: '14.10.26', alt: 'dois cupons da tarde de 14.10' },
  { src: 'arquivo/10.webp', receipts: '#0068', date: '15.10.26', alt: 'cupom anônimo de bom dia rasgado do rolo' },
  { src: 'arquivo/11.webp', receipts: '#0069', date: '15.10.26', alt: 'cupom saindo da impressora GoldenSky' },
  { src: 'arquivo/12.webp', receipts: '#0070', date: '15.10.26', alt: 'cupom na boca da impressora' },
  { src: 'arquivo/13.webp', receipts: '#0071', date: '15.10.26', alt: 'cupom divulgando um show' },
  { src: 'arquivo/14.webp', receipts: '#0071–#0073', date: '15.10.26', alt: 'tira de cupons da manhã de 15.10' },
  { src: 'arquivo/15.webp', receipts: '#0073', date: '15.10.26', alt: 'cupom com uma curiosidade sobre a guerra dos emus' },
  { src: 'arquivo/16.webp', receipts: '#0074', date: '15.10.26', alt: 'cupom saindo da impressora' },
  { src: 'arquivo/17.webp', receipts: '#0076', date: '15.10.26', alt: 'tira longa de cupons perguntando das métricas' },
  { src: 'arquivo/18.webp', receipts: '#0081–#0083', date: '15.10.26', alt: 'três cupons do fim da manhã de 15.10' },
  { src: 'arquivo/19.webp', receipts: '#0083–#0086', date: '15.10.26', alt: 'os últimos cupons saindo da impressora' },
];
