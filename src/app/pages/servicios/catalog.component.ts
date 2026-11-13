import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Client, ClientesService } from '../../shared/services/clientes.service';
import { MascotasService, Pet, PetSize } from '../../shared/services/mascotas.service';
import { Service, ServiciosService } from '../../shared/services/servicios.service';
import { ServiceQuote, TarifasService } from '../../shared/services/tarifas.service';
import { decimalLabel } from '../../shared/services/service-pricing.models';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [],
  templateUrl: './catalog.component.html',
})
export class ServiceCatalogComponent implements OnInit {
  private readonly catalogue = inject(ServiciosService);
  private readonly clients = inject(ClientesService);
  private readonly petsService = inject(MascotasService);
  private readonly pricing = inject(TarifasService);
  private revision = 0;

  readonly loading = signal(true);
  readonly error = signal('');
  readonly petNotice = signal('');
  readonly services = signal<Service[]>([]);
  readonly pets = signal<Pet[]>([]);
  readonly selectedServiceId = signal('');
  readonly selectedPetId = signal('');
  readonly size = signal<PetSize | null>(null);
  readonly calculating = signal(false);
  readonly calculationError = signal('');
  readonly result = signal<ServiceQuote | null>(null);
  readonly selectedService = computed(() => this.services().find(service => service.id === this.selectedServiceId()) ?? null);
  readonly moneyLabel = decimalLabel;

  async ngOnInit(): Promise<void> {
    try {
      const services = await this.catalogue.getAll(true);
      this.services.set(services.filter(service => service.active && service.visible_to_clients));
    } catch {
      this.error.set('No pudimos cargar los servicios. Vuelve a intentarlo más tarde.');
    } finally {
      this.loading.set(false);
    }

    try {
      const own = await this.clients.own({ search: '', page: 1, size: 1 });
      const client: Client | undefined = own.rows[0];
      if (!client) return;
      const pets: Pet[] = [];
      for (let page = 1; ; page++) {
        const found = await this.petsService.search({ search: '', page, size: 100 }, false, client.id);
        pets.push(...found.rows.filter(pet => pet.active));
        if (page * 100 >= found.total || found.rows.length === 0) break;
      }
      this.pets.set(pets);
    } catch {
      this.petNotice.set('No pudimos cargar tus mascotas. Puedes indicar el tamaño manualmente.');
    }
  }

  selectService(id: string): void {
    this.selectedServiceId.set(id);
    this.invalidate();
  }

  selectPet(id: string): void {
    this.selectedPetId.set(id);
    const pet = this.pets().find(item => item.id === id);
    this.size.set(pet?.pet_size ?? null);
    this.invalidate();
  }

  setSize(value: string): void { this.size.set(value ? value as PetSize : null); this.invalidate(); }

  async calculate(): Promise<void> {
    if (!this.selectedServiceId() || this.calculating()) return;
    const revision = ++this.revision;
    this.calculating.set(true);
    this.result.set(null);
    this.calculationError.set('');
    try {
      const result = await this.pricing.quote(this.selectedServiceId(), this.size());
      if (revision === this.revision) this.result.set(result);
    } catch {
      if (revision === this.revision) this.calculationError.set('No pudimos calcular esta tarifa. Revisa el servicio e inténtalo de nuevo.');
    } finally {
      if (revision === this.revision) this.calculating.set(false);
    }
  }

  private invalidate(): void {
    this.revision++;
    this.result.set(null);
    this.calculationError.set('');
    this.calculating.set(false);
  }
}
