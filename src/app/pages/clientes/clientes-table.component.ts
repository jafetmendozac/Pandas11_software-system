import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ComponentCardComponent } from "../../shared/components/common/component-card/component-card.component";
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Client, ClientesService } from '../../shared/services/clientes.service';
import { Profile, ProfilesService, profileLabel } from '../../shared/services/profiles.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';


@Component({
  selector: 'app-clientes-table',
  imports: [
    PageBreadcrumbComponent,
    ComponentCardComponent,
    PersonalizedTable
],
  templateUrl: './clientes-table.component.html',
  styles: ``
})
export class ClientesTableComponent implements OnInit {
  tableData: Client[] = [];
  errorMessage = '';
  profiles: Profile[] = [];
  pets: Pet[] = [];
  selectedClient: Client | null = null;
  selectedClientPets: Pet[] = [];
  petsErrorMessage = '';

  petColumns: TableColumn[] = [
    { key: 'name', label: 'Nombre', placeholder: 'Ej. Max' },
    { key: 'breed', label: 'Raza', placeholder: 'Ej. Pomerania', required: false },
    {
      key: 'pet_sex', label: 'Sexo', required: false, options: [
        { label: 'No especificado', value: '' },
        { label: 'Macho', value: 'MALE' },
        { label: 'Hembra', value: 'FEMALE' },
        { label: 'Desconocido', value: 'UNKNOWN' },
      ],
    },
    {
      key: 'pet_size', label: 'Tamaño', required: false, options: [
        { label: 'No especificado', value: '' },
        { label: 'Pequeño', value: 'SMALL' },
        { label: 'Mediano', value: 'MEDIUM' },
        { label: 'Grande', value: 'LARGE' },
        { label: 'Extra grande', value: 'EXTRA_LARGE' },
      ],
    },
    { key: 'weight_kg', label: 'Peso (kg)', type: 'number', required: false },
    { key: 'allergies', label: 'Alergias', required: false },
    {
      key: 'bites', label: 'Muerde', required: false, options: [
        { label: 'No', value: 'false' },
        { label: 'Sí', value: 'true' },
      ],
    },
    { key: 'client_notes', label: 'Notas', required: false },
    { key: 'birth_date', label: 'Nacimiento', type: 'date', required: false },
    { key: 'active', label: 'Estado', options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ] },
  ];
  columns: TableColumn[] = [
    {
      key: 'profile_id',
      label: 'Perfil relacionado',
      helpText: 'Une este cliente con un perfil existente.',
      required: false,
      options: [],
    },
    {
      key: 'first_name',
      label: 'Nombre',
      placeholder: 'Ej. María',
      helpText: 'Nombre del cliente.',
    },
    {
      key: 'last_name',
      label: 'Apellido',
      placeholder: 'Ej. García',
      helpText: 'Apellido del cliente.',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      placeholder: 'Ej. 999 999 999',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      placeholder: 'Ej. 999 999 999',
    },
    {
      key: 'email',
      label: 'Correo electrónico',
      type: 'text',
      placeholder: 'Ej. cliente@correo.com',
    },
    {
      key: 'address',
      label: 'Dirección',
      placeholder: 'Ej. Av. Principal 123',
    },
    {
      key: 'tax_doc_type',
      label: 'Tipo de documento',
      options: [
        { label: 'DNI', value: 'DNI' },
        { label: 'RUC', value: 'RUC' },
        { label: 'Carné de extranjería', value: 'CE' },
        { label: 'Pasaporte', value: 'PASSPORT' },
      ],
    },
    {
      key: 'tax_doc_number',
      label: 'N.º de documento',
      placeholder: 'Ej. 12345678',
    },
    {
      key: 'business_name',
      label: 'Razón social',
      placeholder: 'Opcional',
      required: false,
    },
    {
      key: 'whatsapp_opt_in',
      label: 'Mensajes x WhatsApp',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  ];

  constructor(
    private readonly clientesService: ClientesService,
    private readonly profilesService: ProfilesService,
    private readonly mascotasService: MascotasService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadClients();
  }

  private async loadClients(): Promise<void> {
    this.errorMessage = '';
    try {
      const [clients, profiles, pets] = await Promise.all([
        this.clientesService.getAll(),
        this.profilesService.getAll(),
        this.mascotasService.getAll(),
      ]);
      this.tableData = clients;
      this.profiles = profiles;
      this.pets = pets;
      this.columns = this.columns.map((column) =>
        column.key === 'profile_id'
          ? {
              ...column,
              options: [
                { label: 'Sin perfil', value: '' },
                ...profiles.map((profile) => ({
                  label: profileLabel(profile),
                  value: profile.id,
                })),
              ],
            }
          : column,
      );
    } catch (error) {
      console.error('No se pudieron cargar los clientes.', error);
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudieron cargar los clientes.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async createClient(transaction: TableRow) {
    await this.clientesService.create(transaction);
    await this.loadClients();
  }

  async deleteClient(transaction: TableRow) {
    await this.clientesService.remove(transaction);
    await this.loadClients();
  }

  async updateClient(transaction: TableRow) {
    await this.clientesService.update(transaction);
    await this.loadClients();
  }

  openPets(client: TableRow): void {
    this.selectedClient = client as Client;
    this.selectedClientPets = this.pets.filter((pet) => pet.client_id === client['id']);
    this.petsErrorMessage = '';
  }

  closePets(): void {
    this.selectedClient = null;
    this.selectedClientPets = [];
    this.petsErrorMessage = '';
  }

  async createPet(pet: TableRow): Promise<void> {
    await this.persistPet(() => this.mascotasService.create({ ...pet, client_id: this.selectedClient?.id }));
  }

  async updatePet(pet: TableRow): Promise<void> {
    await this.persistPet(() => this.mascotasService.update({ ...pet, client_id: this.selectedClient?.id }));
  }

  async deletePet(pet: TableRow): Promise<void> {
    await this.persistPet(() => this.mascotasService.remove(pet));
  }

  private async persistPet(action: () => Promise<void>): Promise<void> {
    try {
      await action();
      const pets = await this.mascotasService.getAll();
      this.pets = pets;
      this.selectedClientPets = pets.filter((pet) => pet.client_id === this.selectedClient?.id);
    } catch (error) {
      this.petsErrorMessage = error instanceof Error ? error.message : 'No se pudo guardar la mascota.';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  get selectedClientName(): string {
    if (!this.selectedClient) return '';
    return `${this.selectedClient.first_name ?? ''} ${this.selectedClient.last_name ?? ''}`.trim() || 'Cliente sin nombre';
  }
}
