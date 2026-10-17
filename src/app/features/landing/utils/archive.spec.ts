import { ARCHIVE_PHOTOS } from './archive';

const firstReceipt = (receipts: string) => Number(receipts.match(/\d+/)![0]);

describe('archive', () => {
  it('given the photo archive, when read, then the photos follow the receipt numbers in order', () => {
    const numbers = ARCHIVE_PHOTOS.map(photo => firstReceipt(photo.receipts));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  it('given the photo archive, when read, then every photo has its own file and a description', () => {
    const sources = ARCHIVE_PHOTOS.map(photo => photo.src);
    expect(new Set(sources).size).toBe(sources.length);
    expect(ARCHIVE_PHOTOS.every(photo => photo.src.startsWith('arquivo/') && photo.alt.trim())).toBeTrue();
  });
});
