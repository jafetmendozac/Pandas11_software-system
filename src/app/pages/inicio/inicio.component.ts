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
  @ViewChild('siteHome') private siteHome?: ElementRef<HTMLAnchorElement>;
  private readonly flyerApi = inject(HomeFlyersService);
  private readonly zone = inject(NgZone);
  private flyerRevision = 0;
  private dayTimer?: ReturnType<typeof setInterval>;
  private welcomeTimer?: ReturnType<typeof setTimeout>;
  readonly menuOpen = signal(false);
  readonly welcomeVisible = signal(false);
  readonly activeFlyer = signal<{ row: HomeFlyer; url: string } | null>(null);
  readonly flyerExpanded = signal(false);
  readonly flyerDays = HOME_FLYER_DAYS;
  private displayedDay = weekdayInLima(new Date());
  readonly year = new Date().getFullYear();
  readonly whatsapp = 'https://wa.me/51976079212';
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
    { number: '01', title: 'Baño estético', tag: 'Servicio principal', tone: 'aqua',
      description: 'Higiene y cuidado para que tu engreído se vea y se sienta bien. Coordinamos la atención según su tamaño y pelaje.',
          icon: 'M3 12h18M5 12v4a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-4M7 20v2m10-2v2M5 12V5a3 3 0 0 1 6 0M9 6h4M15 8v1m4-3v1',
          price: 'Desde S/ 25' },
    { number: '02', title: 'Baño medicado para parásitos externos', tag: 'Adicional al baño estético', tone: 'mint',
      description: 'Se añade al baño estético. Recargo de S/ 5 a S/ 15.',
      icon: 'M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Zm0 5v6m-3-3h6' },
    { number: '03', title: 'Desparasitación', tag: 'Adicional o servicio solo', tone: 'gold',
      description: 'Disponible por separado o junto con un servicio principal, de S/ 5 a S/ 30.',
      icon: 'M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Zm-3 9 2 2 4-4' },
    { number: '04', title: 'Baño y corte', tag: 'Servicio principal', tone: 'pink',
      description: 'Baño y corte para renovar su look, con atención al tipo de pelaje y a lo que buscas para tu compañero.',
        price: 'Desde S/ 45',
        icon: 'M9 9 20 20M9 15 20 4M4 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z' },
    { number: '05', title: 'Corte higiénico', tag: 'Adicional o servicio solo', tone: 'purple',
      description: 'Disponible por separado o junto con baño estético, de S/ 5 a S/ 20.',
      icon: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9L7.5 14 3 9.6l6.2-.9L12 3Z' },
    { number: '06', title: 'Corte estético', tag: 'Servicio principal', tone: 'pink',
      description: 'Corte según el tamaño de tu mascota, desde S/ 25.',
      price: 'Desde S/ 25',
      icon: 'M9 9 20 20M9 15 20 4M4 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z' },
    { number: '07', title: 'Baño medicado para piel delicada', tag: 'Adicional al baño estético', tone: 'mint',
      description: 'Se añade al baño estético. Recargo de S/ 5 a S/ 15.',
      icon: 'M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Zm0 5v6m-3-3h6' },
    { number: '08', title: 'Cepillado', tag: 'Adicional o servicio solo', tone: 'aqua',
      description: 'Disponible por separado o junto con un servicio principal. Desde S/ 5 según el tamaño.',
      icon: 'M5 5h14M5 9h14M7 9v10m5-10v10m5-10v10M4 19h16' },
    { number: '09', title: 'Corte de uñas', tag: 'Adicional o servicio solo', tone: 'purple',
      description: 'Disponible por separado o junto con un servicio principal. S/ 5 para todos los tamaños.',
      icon: 'M5 5h14M5 9h14M7 9v10m5-10v10m5-10v10M4 19h16' },
  ];

  ngOnInit(): void {
    this.startWelcome();
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
    if (this.welcomeTimer) clearTimeout(this.welcomeTimer);
  }

  skipWelcome(): void {
    this.finishWelcome(true);
  }

  private startWelcome(): void {
    const storageKey = 'pandas11-welcome-seen';
    try {
      if (sessionStorage.getItem(storageKey) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sessionStorage.setItem(storageKey, 'true');
        return;
      }
    } catch {
      // Si el navegador bloquea Storage, la bienvenida sigue siendo omitible.
    }

    this.welcomeVisible.set(true);
    this.zone.runOutsideAngular(() => {
      this.welcomeTimer = setTimeout(() => this.zone.run(() => this.finishWelcome()), 6_000);
    });
  }

  private finishWelcome(restoreFocus = false): void {
    if (!this.welcomeVisible()) return;
    if (this.welcomeTimer) clearTimeout(this.welcomeTimer);
    this.welcomeVisible.set(false);
    try {
      sessionStorage.setItem('pandas11-welcome-seen', 'true');
    } catch {
      // No se requiere persistencia para navegar por la portada.
    }
    if (restoreFocus) setTimeout(() => this.siteHome?.nativeElement.focus());
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
      if (revision === this.flyerRevision) {
        this.activeFlyer.set({ row, url });
        this.flyerExpanded.set(true);
      }
    } catch {
      // La portada informativa permanece disponible si no responde Storage.
      if (revision === this.flyerRevision) this.activeFlyer.set(null);
    }
  }

  closeFlyer(): void {
    if (!this.flyerExpanded()) return;
    this.flyerExpanded.set(false);
  }

  closeMenu(restoreFocus = false): void {
    this.menuOpen.set(false);
    if (restoreFocus) this.menuToggle?.nativeElement.focus();
  }
}
