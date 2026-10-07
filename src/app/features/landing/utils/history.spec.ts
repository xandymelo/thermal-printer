import { toHistoryCards } from './history';

describe('history', () => {
  const entries = [
    { text: 'terceira', handle: 'eliza', sym: '♥', at: new Date(2026, 9, 7, 9, 5).getTime() },
    { text: 'segunda', handle: '', at: new Date(2026, 9, 6, 22, 30).getTime() },
    { text: 'primeira', handle: 'ana', at: new Date(2026, 9, 5, 8, 0).getTime() },
  ];

  it('given entries newest first, when mapped, then numbers them counting down from the total', () => {
    expect(toHistoryCards(entries, 5).map(c => c.no)).toEqual(['#0003', '#0002', '#0001']);
  });

  it('given a limit smaller than the history, when mapped, then shows only the newest ones', () => {
    expect(toHistoryCards(entries, 2).map(c => c.text)).toEqual(['terceira', 'segunda']);
  });

  it('given an entry without handle, when mapped, then shows it as anônimo', () => {
    const [first, second] = toHistoryCards(entries, 5);
    expect(first.from).toBe('@eliza');
    expect(second.from).toBe('anônimo');
  });

  it('given an entry timestamp, when mapped, then formats the date as dd.mm.yy  hh:mm', () => {
    expect(toHistoryCards(entries, 1)[0].date).toBe('07.10.26  09:05');
  });

  it('given an entry with a symbol, when mapped, then frames the header with it', () => {
    expect(toHistoryCards(entries, 1)[0].header).toBe('♥ 58mm ♥');
  });

  it('given an entry without symbol, when mapped, then frames the header with *', () => {
    expect(toHistoryCards(entries, 2)[1].header).toBe('* 58mm *');
  });
});
