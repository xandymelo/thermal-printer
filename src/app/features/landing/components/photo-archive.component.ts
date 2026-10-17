import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { ArchivePhoto } from '../utils/archive';

const SCROLL_STEP_PX = 320;

@Component({
  selector: 'app-photo-archive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="archive">
      <div #track class="track">
        @for (photo of photos(); track photo.src) {
          <figure class="photo">
            <a [href]="photo.src" target="_blank" rel="noopener">
              <img [src]="photo.src" [alt]="photo.alt" loading="lazy" width="900" height="1600" />
            </a>
            <figcaption>{{ photo.receipts }} · {{ photo.date }}</figcaption>
          </figure>
        }
      </div>
      <div class="nav">
        <button type="button" aria-label="anterior" (click)="scroll(-1)">&lt;</button>
        <button type="button" aria-label="próxima" (click)="scroll(1)">&gt;</button>
      </div>
    </div>
  `,
  styleUrl: './photo-archive.component.scss',
})
export class PhotoArchiveComponent {
  readonly photos = input.required<ArchivePhoto[]>();
  private track = viewChild.required<ElementRef<HTMLElement>>('track');

  protected scroll(direction: 1 | -1): void {
    this.track().nativeElement.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' });
  }
}
