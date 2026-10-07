import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { ReceiptCarouselComponent } from './components/receipt-carousel.component';
import { PRINT_CONFIG } from './print.config';
import { PrintService } from './services/print.service';
import { PrintState } from './states/print.state';
import { toHistoryCards } from './utils/history';
import { ART_STYLES, ArtStyle, countRows, formatTicketDate, printerArtParts, ticketNumber } from './utils/printer-art';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReceiptCarouselComponent],
  providers: [PrintState, PrintService],
})
export class LandingComponent implements OnInit, OnDestroy {
  private printService = inject(PrintService);
  protected state = inject(PrintState);
  protected config = inject(PRINT_CONFIG);
  protected readonly artStyles = ART_STYLES;

  protected locked = computed(() => this.state.status() !== 'idle');
  protected cantPrint = computed(() => this.locked() || !this.state.text().trim());
  protected rows = computed(() => countRows(this.state.text()));
  protected ticketNo = computed(() => ticketNumber(new Date(this.state.now())));
  protected today = computed(() => formatTicketDate(new Date(this.state.now())));

  protected art = computed(() =>
    printerArtParts({
      status: this.state.status(),
      tick: this.state.tick(),
      remainingMs: (this.state.next() ?? 0) - this.state.now(),
      style: this.state.artStyle(),
    }),
  );

  protected historyCards = computed(() => toHistoryCards(this.state.history(), this.config.historyLimit));

  protected buttonLabel = computed(() => {
    switch (this.state.status()) {
      case 'printing': return 'imprimindo…';
      case 'done': return 'volte amanhã';
      default: return 'imprimir';
    }
  });

  ngOnInit(): void {
    this.printService.start();
  }

  ngOnDestroy(): void {
    this.printService.stop();
  }

  protected onText(event: Event): void {
    this.printService.setText((event.target as HTMLTextAreaElement).value);
  }

  protected onHandle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.printService.setHandle(input.value);
    // O sinal pode não mudar (ex.: só caracteres inválidos digitados), então o input não seria re-renderizado.
    input.value = this.state.handle();
  }

  protected togglePrivate(): void {
    this.printService.togglePrivate();
  }

  protected pickStyle(style: ArtStyle): void {
    this.printService.setArtStyle(style);
  }

  protected print(): void {
    this.printService.print();
  }
}
