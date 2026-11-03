import { Component, OnInit, inject, signal } from '@angular/core';
import { Client, ClientesService } from '../../shared/services/clientes.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';
import { RecordsService, Vaccination } from '../../shared/services/records.service';

@Component({
  selector: 'app-my-records',
  standalone: true,
  imports: [],
  templateUrl: './my-records.component.html',
})
export class MyRecordsComponent implements OnInit {
  private readonly clientsService = inject(ClientesService);
  private readonly petsService = inject(MascotasService);
  private readonly recordsService = inject(RecordsService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly client = signal<Client | null>(null);
  readonly pets = signal<Pet[]>([]);
  readonly selectedPet = signal<Pet | null>(null);
  readonly vaccinations = signal<Vaccination[]>([]);
  readonly detailsLoading = signal(false);
  readonly detailsError = signal('');
  private detailsRevision = 0;

  async ngOnInit(): Promise<void> {
    try {
      const own = await this.clientsService.own({ search: '', page: 1, size: 1 });
      const client = own.rows[0] ?? null;
      this.client.set(client);
      if (client) {
        const pets: Pet[] = [];
        for (let page = 1; ; page++) {
          const result = await this.petsService.search({ search: '', page, size: 100 }, false, client.id);
          pets.push(...result.rows);
          if (pets.length >= result.total || result.rows.length === 0) break;
        }
        this.pets.set(pets);
      }
    } catch {
      this.error.set('No pudimos cargar tus datos. Vuelve a intentarlo más tarde.');
    } finally {
      this.loading.set(false);
    }
  }

  async showPet(pet: Pet): Promise<void> {
    const revision = ++this.detailsRevision;
    this.selectedPet.set(pet);
    this.vaccinations.set([]);
    this.detailsError.set('');
    this.detailsLoading.set(true);
    try {
      const rows = await this.recordsService.vaccinations(pet.id);
      if (revision === this.detailsRevision) this.vaccinations.set(rows);
    } catch {
      if (revision === this.detailsRevision) this.detailsError.set('No pudimos cargar las vacunas de esta mascota.');
    } finally {
      if (revision === this.detailsRevision) this.detailsLoading.set(false);
    }
  }

  sizeLabel(size: Pet['pet_size']): string {
    return ({ TOY: 'Miniatura', SMALL: 'Pequeño', MEDIUM: 'Mediano', LARGE: 'Grande', EXTRA_LARGE: 'Extra grande' } as const)[size!] ?? 'No indicado';
  }
}
