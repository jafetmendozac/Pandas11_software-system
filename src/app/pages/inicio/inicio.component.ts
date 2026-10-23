import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { ThemeService } from '../../shared/services/theme.service';
import { HomeFlyersService } from '../../shared/services/home-flyers.service';
import { HOME_FLYER_DAYS, HomeFlyer, weekdayInLima } from '../../shared/services/home-flyers.models';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, A11yModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent implements OnInit, OnDestroy {
  // Restaura el tema local existente sin construir servicios de sesión o datos.
  constructor(_theme: ThemeService) {}

  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('flyerOpen') private flyerOpen?: ElementRef<HTMLButtonElement>;
  private readonly flyerApi = inject(HomeFlyersService);
  private readonly zone = inject(NgZone);
  private flyerRevision = 0;
  private dayTimer?: ReturnType<typeof setInterval>;
  readonly menuOpen = signal(false);
  readonly activeFlyer = signal<{ row: HomeFlyer; url: string } | null>(null);
  readonly flyerExpanded = signal(false);
  readonly flyerDays = HOME_FLYER_DAYS;
  private displayedDay = weekdayInLima(new Date());
  readonly year = new Date().getFullYear();
  readonly whatsapp = 'https://wa.me/51972704860';
  readonly maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(
    'Calle General Urco Mz. C Lote 11, Urbanización Los Laureles, Trujillo, La Libertad, Perú',
  );
  readonly links = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#boutique', label: 'Boutique' },
    { href: '#nosotros', label: 'Nosotros' },
    { href: '#visitanos', label: 'Visítanos' },
  ];
  readonly services = [
    { number: '01', title: 'Baño', tag: 'Un momento para mimarlo', tone: 'aqua',
      description: 'Higiene y cuidado para que tu engreído se vea y se sienta bien. Coordinamos la atención según su tamaño y pelaje.',
      icon: 'M3 12h18M5 12v4a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-4M7 20v2m10-2v2M5 12V5a3 3 0 0 1 6 0M9 6h4M15 8v1m4-3v1' },
    { number: '02', title: 'Estilismo y corte', tag: 'Su personalidad, su estilo', tone: 'pink',
      description: 'Baño y corte para renovar su look, con atención al tipo de pelaje y a lo que buscas para tu compañero.',
      icon: 'M9 9 20 20M9 15 20 4M4 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z' },
    { number: '03', title: 'Corte higiénico', tag: 'Los detalles también cuentan', tone: 'purple',
      description: 'Un cuidado enfocado en su higiene y presentación. Consúltanos para coordinar la atención que necesita tu perro.',
      icon: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9L7.5 14 3 9.6l6.2-.9L12 3Z' },
  ];

  ngOnInit(): void {
    void this.loadFlyer();
    this.zone.runOutsideAngular(() => {
      this.dayTimer = setInterval(() => {
        const today = weekdayInLima(new Date());
        if (today !== this.displayedDay) {
          this.zone.run(() => {
            this.displayedDay = today;
            this.closeFlyer();
            void this.loadFlyer();
          });
        }
      }, 30_000);
    });
  }

  ngOnDestroy(): void {
    this.flyerRevision++;
    if (this.dayTimer) clearInterval(this.dayTimer);
  }

  private async loadFlyer(): Promise<void> {
    const revision = ++this.flyerRevision;
    try {
      const row = await this.flyerApi.today();
      if (!row?.object_path || !row.alt_text) {
        if (revision === this.flyerRevision) this.activeFlyer.set(null);
        return;
      }
      const url = await this.flyerApi.signedUrl(row.object_path);
      if (revision === this.flyerRevision) this.activeFlyer.set({ row, url });
    } catch {
      // La portada informativa permanece disponible si no responde Storage.
      if (revision === this.flyerRevision) this.activeFlyer.set(null);
    }
  }

  async openFlyer(): Promise<void> {
    const current = this.activeFlyer();
    if (!current?.row.object_path) return;
    try {
      const url = await this.flyerApi.signedUrl(current.row.object_path);
      if (this.activeFlyer()?.row.object_path !== current.row.object_path) return;
      this.activeFlyer.set({ row: current.row, url });
      this.flyerExpanded.set(true);
    } catch {
      this.flyerExpanded.set(false);
    }
  }

  closeFlyer(): void {
    if (!this.flyerExpanded()) return;
    this.flyerExpanded.set(false);
    this.flyerOpen?.nativeElement.focus();
  }

  closeMenu(restoreFocus = false): void {
    this.menuOpen.set(false);
    if (restoreFocus) this.menuToggle?.nativeElement.focus();
  }
}
