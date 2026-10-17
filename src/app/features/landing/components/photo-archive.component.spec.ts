import { TestBed } from '@angular/core/testing';
import { ArchivePhoto } from '../utils/archive';
import { PhotoArchiveComponent } from './photo-archive.component';

const PHOTOS: ArchivePhoto[] = [
  { src: 'arquivo/01.webp', receipts: '#0004–#0028', date: '12.10.26', alt: 'cupons do primeiro dia' },
  { src: 'arquivo/02.webp', receipts: '#0059', date: '14.10.26', alt: 'cupom de bom dia' },
];

describe('PhotoArchiveComponent', () => {
  function render(photos: ArchivePhoto[]): HTMLElement {
    const fixture = TestBed.createComponent(PhotoArchiveComponent);
    fixture.componentRef.setInput('photos', photos);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('given two photos, when rendered, then shows each one lazily with its description', () => {
    const imgs = Array.from(render(PHOTOS).querySelectorAll('img'));
    expect(imgs.map(img => img.getAttribute('src'))).toEqual(['arquivo/01.webp', 'arquivo/02.webp']);
    expect(imgs.every(img => img.getAttribute('loading') === 'lazy')).toBeTrue();
    expect(imgs[0].getAttribute('alt')).toBe('cupons do primeiro dia');
  });

  it('given a photo, when rendered, then the caption shows its receipts and date', () => {
    expect(render(PHOTOS).querySelector('figcaption')?.textContent).toContain('#0004–#0028 · 12.10.26');
  });

  it('given a photo, when rendered, then it links to the full-size image in a new tab', () => {
    const link = render(PHOTOS).querySelector('a')!;
    expect(link.getAttribute('href')).toBe('arquivo/01.webp');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
