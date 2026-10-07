import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { HistoryCard } from '../utils/history';

const SCROLL_STEP_PX = 280;

@Component({
  selector: 'app-receipt-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="carousel">
      <div #track class="track">
        @for (card of cards(); track card.no) {
          <article class="receipt">
            <div class="edge edge--top"></div>
            <div class="body">
              <div class="title">{{ card.header }}</div>
              <div class="meta"><span>{{ card.no }}</span><span>{{ card.date }}</span></div>
              <div class="rule"></div>
              <div class="from">de: <span>{{ card.from }}</span></div>
              <p class="text">{{ card.text }}</p>
              <div class="rule"></div>
              <div class="barcode" aria-hidden="true">|| ||| | |||| || | ||| || ||||</div>
              <div class="footnote">impresso em papel térmico</div>
            </div>
            <div class="edge edge--bottom"></div>
          </article>
        }
      </div>
      <div class="nav">
        <button type="button" aria-label="anterior" (click)="scroll(-1)">&lt;</button>
        <button type="button" aria-label="próxima" (click)="scroll(1)">&gt;</button>
      </div>
    </div>
  `,
  styleUrl: './receipt-carousel.component.scss',
})
export class ReceiptCarouselComponent {
  readonly cards = input.required<HistoryCard[]>();
  private track = viewChild.required<ElementRef<HTMLElement>>('track');

  protected scroll(direction: 1 | -1): void {
    this.track().nativeElement.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' });
  }
}
