import { TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { ARCHIVE_PHOTOS } from './utils/archive';

describe('LandingComponent', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('given the printer is retired, when rendered, then the header says offline', () => {
    expect(render().querySelector('.status')?.textContent?.trim()).toBe('offline');
  });

  it('given the printer is retired, when rendered, then there is no way to write or print', () => {
    const el = render();
    expect(el.querySelector('textarea')).toBeNull();
    expect(el.querySelector('.print-btn')).toBeNull();
  });

  it('given the printer is retired, when rendered, then the history shows every archived photo', () => {
    expect(render().querySelectorAll('app-photo-archive img').length).toBe(ARCHIVE_PHOTOS.length);
  });

  it('given a style is picked, when rendered, then the printer drawing switches to it', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const before = fixture.nativeElement.querySelector('.printer-art').textContent;
    const option = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('.style-option')).find(
      b => b.textContent?.trim() === 'hash',
    )!;
    option.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.printer-art').textContent).not.toBe(before);
    expect(option.getAttribute('aria-pressed')).toBe('true');
  });
});
