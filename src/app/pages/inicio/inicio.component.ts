import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  // Restaura el tema local existente sin construir servicios de sesión o datos.
  constructor(_theme: ThemeService) {}

  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  readonly menuOpen = signal(false);
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

  closeMenu(restoreFocus = false): void {
    this.menuOpen.set(false);
    if (restoreFocus) this.menuToggle?.nativeElement.focus();
  }
}
