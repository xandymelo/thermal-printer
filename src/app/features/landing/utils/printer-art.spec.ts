import {
  ART_STYLES,
  countRows,
  formatCountdown,
  formatTicketDate,
  nextMidnight,
  printerArtParts,
  renderPrinterArt,
  ticketNumber,
} from './printer-art';

describe('printer-art', () => {
  describe('formatCountdown', () => {
    it('given 3h 4min 5s left, when formatted, then returns hh:mm:ss', () => {
      expect(formatCountdown((3 * 3600 + 4 * 60 + 5) * 1000)).toBe('03:04:05');
    });

    it('given a negative remaining time, when formatted, then clamps to zero', () => {
      expect(formatCountdown(-5000)).toBe('00:00:00');
    });
  });

  describe('ticketNumber', () => {
    it('given february 1st, when numbered, then returns the 4-digit day of year', () => {
      expect(ticketNumber(new Date(2026, 1, 1, 10))).toBe('#0032');
    });
  });

  describe('formatTicketDate', () => {
    it('given a date, when formatted, then returns dd.mm.yy', () => {
      expect(formatTicketDate(new Date(2026, 9, 7))).toBe('07.10.26');
    });
  });

  describe('nextMidnight', () => {
    it('given an afternoon time, when computed, then returns the start of the next day', () => {
      const from = new Date(2026, 9, 7, 15, 30);
      expect(nextMidnight(from)).toBe(new Date(2026, 9, 8, 0, 0, 0, 0).getTime());
    });
  });

  describe('countRows', () => {
    it('given empty text, when counted, then returns the 4-row minimum', () => {
      expect(countRows('')).toBe(4);
    });

    it('given lines longer than 32 columns, when counted, then wraps each line', () => {
      const text = ['a'.repeat(33), 'b', 'c'.repeat(64), '', 'd'].join('\n');
      expect(countRows(text)).toBe(2 + 1 + 2 + 1 + 1);
    });
  });

  describe('renderPrinterArt', () => {
    const lines = (art: string) => art.split('\n');

    it('given idle status, when rendered, then shows the ready message on the screen', () => {
      const art = renderPrinterArt({ status: 'idle', tick: 0, remainingMs: 0, style: 'ascii' });
      expect(lines(art).length).toBe(12);
      expect(lines(art)[5]).toContain('pronta');
      expect(lines(art)[6]).toContain('1 impressao disponivel hoje');
    });

    it('given every style and status, when rendered, then all 12 lines are 48 columns wide', () => {
      for (const style of ART_STYLES) {
        for (const status of ['idle', 'printing', 'done', 'error'] as const) {
          const art = renderPrinterArt({ status, tick: 3, remainingMs: 1000, style });
          expect(lines(art).length).withContext(`${style}/${status}`).toBe(12);
          lines(art).forEach(l => expect(l.length).withContext(`${style}/${status}: "${l}"`).toBe(48));
        }
      }
    });

    it('given every style, when rendered idle, then the screen text stays readable', () => {
      for (const style of ART_STYLES) {
        const art = renderPrinterArt({ status: 'idle', tick: 0, remainingMs: 0, style });
        expect(art).withContext(style).toContain('pronta');
      }
    });

    it('given the style list, when read, then offers the six styles of the design in order', () => {
      expect(ART_STYLES).toEqual(['ascii', 'dots', 'linhas', 'blocos', 'meio-tom', 'retrô']);
    });

    it('given printing at tick 3, when rendered, then shows a progress bar of 6 filled cells', () => {
      const art = renderPrinterArt({ status: 'printing', tick: 3, remainingMs: 0, style: 'ascii' });
      expect(lines(art)[6]).toContain('[######..........]');
    });

    it('given done status, when rendered, then shows the countdown to the next print', () => {
      const art = renderPrinterArt({ status: 'done', tick: 0, remainingMs: 65_000, style: 'ascii' });
      expect(lines(art)[5]).toContain('impresso. obrigado.');
      expect(lines(art)[6]).toContain('proxima em 00:01:05');
    });

    it('given error status, when rendered, then asks to try again', () => {
      const art = renderPrinterArt({ status: 'error', tick: 0, remainingMs: 0, style: 'ascii' });
      expect(lines(art)[5]).toContain('sem papel?');
      expect(lines(art)[6]).toContain('tente de novo');
    });

    it('given dots style, when rendered, then the frame becomes dots but the screen text stays readable', () => {
      const art = renderPrinterArt({ status: 'idle', tick: 0, remainingMs: 0, style: 'dots' });
      expect(lines(art)[0]).toMatch(/^[ ·]+$/);
      expect(lines(art)[5]).toContain('pronta');
    });
  });

  describe('printerArtParts', () => {
    it('given every style, when split, then before + led + after rebuilds the full drawing', () => {
      for (const style of ART_STYLES) {
        const input = { status: 'printing' as const, tick: 1, remainingMs: 0, style };
        const { before, led, after } = printerArtParts(input);
        expect(before + led + after).withContext(style).toBe(renderPrinterArt(input));
      }
    });

    it('given printing on an odd tick, when split, then the LED is lit and keeps its "o"', () => {
      const parts = printerArtParts({ status: 'printing', tick: 1, remainingMs: 0, style: 'ascii' });
      expect(parts.led).toBe('(o)');
      expect(parts.ledOn).toBeTrue();
    });

    it('given printing on an even tick, when split, then the LED is off', () => {
      expect(printerArtParts({ status: 'printing', tick: 2, remainingMs: 0, style: 'ascii' }).ledOn).toBeFalse();
    });

    it('given idle status, when split, then the LED is off', () => {
      expect(printerArtParts({ status: 'idle', tick: 1, remainingMs: 0, style: 'ascii' }).ledOn).toBeFalse();
    });

    it('given dots style lit, when split, then the LED shows a readable (o)', () => {
      expect(printerArtParts({ status: 'printing', tick: 1, remainingMs: 0, style: 'dots' }).led).toBe('(o)');
    });
  });
});
