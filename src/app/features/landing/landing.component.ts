import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PhotoArchiveComponent } from './components/photo-archive.component';
import { ARCHIVE_PHOTOS } from './utils/archive';
import { ART_STYLES, ArtStyle, printerArtParts } from './utils/printer-art';

/** A impressora ficou online de 12 a 15.10.26; agora o site só guarda as fotos dos cupons. */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PhotoArchiveComponent],
})
export class LandingComponent {
  protected readonly artStyles = ART_STYLES;
  protected readonly photos = ARCHIVE_PHOTOS;
  protected artStyle = signal<ArtStyle>('ascii');

  protected art = computed(() =>
    printerArtParts({ status: 'offline', tick: 0, remainingMs: 0, style: this.artStyle() }),
  );

  protected pickStyle(style: ArtStyle): void {
    this.artStyle.set(style);
  }
}
