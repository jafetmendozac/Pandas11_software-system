import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RecordDetailsComponent } from '../../shared/components/records/record-details/record-details.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { Client, ClientesService, PageQuery } from '../../shared/services/clientes.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';
import { PetBreedsService } from '../../shared/services/pet-breeds.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, ComponentCardComponent, PageBreadcrumbComponent, RecordDetailsComponent, PersonalizedTable],
  templateUrl: './client-detail.component.html',
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clients = inject(ClientesService);
  private readonly pets = inject(MascotasService);
  private readonly breeds = inject(PetBreedsService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authorization = inject(AuthorizationService);

  client: Client | null = null;
  petsRows: Pet[] = [];
  petsTotal = 0;
  loading = true;
  petsLoading = false;
  error = '';
  petsError = '';
  readonly archived = this.route.snapshot.queryParamMap.get('archived') === '1';
  readonly returnQueryParams = {
    q: this.route.snapshot.queryParamMap.get('q') ?? undefined,
    page: this.route.snapshot.queryParamMap.get('page') ?? undefined,
    archived: this.route.snapshot.queryParamMap.get('archived') ?? undefined,
  };
  private petQuery: PageQuery = { search: '', page: 1, size: 10 };
  petColumns: TableColumn[] = [
    { key: 'photo_signed_url', label: 'Foto', editable: false, display: 'image', hideHeader: true },
    { key: 'name', label: 'Nombre', placeholder: 'Ej. Max' },
    { key: 'breed_id', label: 'Raza', required: false, options: [] },
    { key: 'pet_sex', label: 'Sexo', required: false, options: [{ label: 'No especificado', value: '' }, { label: 'Macho', value: 'MALE' }, { label: 'Hembra', value: 'FEMALE' }, { label: 'Desconocido', value: 'UNKNOWN' }] },
    { key: 'pet_size', label: 'Tamaño', required: false, options: [{ label: 'No especificado', value: '' }, { label: 'Miniatura', value: 'TOY' }, { label: 'Pequeño', value: 'SMALL' }, { label: 'Mediano', value: 'MEDIUM' }, { label: 'Grande', value: 'LARGE' }, { label: 'Extra grande', value: 'EXTRA_LARGE' }] },
    { key: 'weight_kg', label: 'Peso (kg)', type: 'number', required: false },
    { key: 'allergies', label: 'Alergias', control: 'radio', required: false, options: [{ label: 'No', value: 'false' }, { label: 'Sí', value: 'true' }] },
    { key: 'bites', label: 'Muerde', control: 'radio', required: false, options: [{ label: 'No', value: 'false' }, { label: 'Sí', value: 'true' }] },
    { key: 'client_notes', label: 'Notas del cliente', required: false },
    { key: 'birth_date', label: 'Nacimiento', type: 'date', required: false },
    { key: 'death_date', label: 'Fallecimiento', type: 'date', required: false },
    { key: 'active', label: 'Estado', control: 'radio', options: [{ label: 'Activo', value: 'true' }, { label: 'Inactivo', value: 'false' }] },
  ];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = 'No encontramos el cliente solicitado.';
      return;
    }
    try {
      this.client = await this.clients.get(id, this.archived);
      if (!this.client) {
        this.error = 'El cliente no existe o no tienes permiso para verlo.';
        return;
      }
      const breeds = await this.breeds.getAll();
      this.petColumns = this.petColumns.map(column => column.key === 'breed_id'
        ? { ...column, options: [{ label: 'No especificada', value: '' }, ...breeds.map(breed => ({ label: breed.name + (breed.active ? '' : ' (inactiva)'), value: breed.id }))] }
        : column);
      await this.loadPets();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo cargar la ficha del cliente.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async loadPets(query = this.petQuery): Promise<void> {
    if (!this.client)
      return;
    this.petQuery = query;
    this.petsLoading = true;
    this.petsError = '';
    try {
      const result = await this.pets.search(query, this.archived, this.client.id);
      this.petsRows = result.rows;
      this.petsTotal = result.total;
    } catch (error) {
      this.petsError = error instanceof Error ? error.message : 'No se pudieron cargar las mascotas.';
    } finally {
      this.petsLoading = false;
      this.cdr.markForCheck();
    }
  }

  readonly savePet = async (row: TableRow, mode: 'create' | 'update' | 'delete'): Promise<void> => {
    if (!this.client || this.archived || !this.authorization.has('pets.manage'))
      throw new Error('Operación no permitida.');
    const pet = { ...row, client_id: this.client.id };
    await (mode === 'create' ? this.pets.create(pet) : mode === 'update' ? this.pets.update(pet) : this.pets.remove(pet));
    if (mode !== 'update')
      this.petQuery = { ...this.petQuery, page: 1 };
    await this.loadPets();
  };

  openPet(row: TableRow): void {
    const pet = row as Pet;
    if (!this.client)
      return;
    void this.router.navigate(['/mascotas', pet.id], {
      queryParams: { fromClient: this.client.id, ...this.returnQueryParams },
    });
  }

  get clientName(): string {
    return `${this.client?.first_name ?? ''} ${this.client?.last_name ?? ''}`.trim();
  }
}
