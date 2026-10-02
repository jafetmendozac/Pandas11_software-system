import { Component, OnInit, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Client, ClientesService } from '../../shared/services/clientes.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';

@Component({
  selector: 'app-mascotas-table',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    PersonalizedTable,
  ],
  templateUrl: './mascotas-table.component.html',
  styles: ``
})
export class MascotasTableComponent implements OnInit {
  tableData = signal<Pet[]>([]);
  errorMessage = signal('');
  loading = signal(true);

  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Nombre',
      placeholder: 'Ej. Max',
      helpText: 'Escribe el nombre de la mascota.',
    },
    {
      key: 'client_id',
      label: 'Cliente',
      helpText: 'Selecciona el dueño de la mascota.',
      options: [],
    },
    {
      key: 'breed',
      label: 'Raza',
      placeholder: 'Ej. Pomerania',
      helpText: 'Indica la raza, si la conoces.',
      required: false,
    },
    {
      key: 'pet_sex',
      label: 'Sexo',
      helpText: 'Define el sexo de la mascota.',
      required: false,
      options: [
        { label: 'No especificado', value: '' },
        { label: 'Macho', value: 'MALE' },
        { label: 'Hembra', value: 'FEMALE' },
        { label: 'Desconocido', value: 'UNKNOWN' },
      ],
    },
    {
      key: 'pet_size',
      label: 'Tamaño',
      helpText: 'Define el tamaño de la mascota.',
      required: false,
      options: [
        { label: 'No especificado', value: '' },
        { label: 'Pequeño', value: 'SMALL' },
        { label: 'Mediano', value: 'MEDIUM' },
        { label: 'Grande', value: 'LARGE' },
        { label: 'Extra grande', value: 'EXTRA_LARGE' },
      ],
    },
    {
      key: 'pet_coat_type',
      label: 'Tipo de pelo',
      helpText: 'Define el pelaje de la mascota.',
      required: false,
      options: [
        { label: 'No especificado', value: '' },
        { label: 'Corto', value: 'SHORT' },
        { label: 'Medio', value: 'MEDIUM' },
        { label: 'Largo', value: 'LONG' },
        { label: 'Cerda', value: 'WIRE' },
        { label: 'Rizado', value: 'CURLY' },
        { label: 'Sin pelo', value: 'HAIRLESS' },
      ],
    },
    {
      key: 'weight_kg',
      label: 'Peso (kg)',
      type: 'number',
      placeholder: 'Ej. 4.5',
      helpText: 'Ingresa el peso en kilogramos.',
      required: false,
    },
    {
      key: 'allergies',
      label: 'Alergias',
      placeholder: 'Ej. Polvo',
      helpText: 'Anota alergias conocidas.',
      required: false,
    },
    {
      key: 'bites',
      label: 'Muerde',
      helpText: 'Indica si la mascota tiende a morder.',
      required: false,
      options: [
        { label: 'No', value: 'false' },
        { label: 'Sí', value: 'true' },
      ],
    },
    {
      key: 'client_notes',
      label: 'Notas del cliente',
      placeholder: 'Ej. No usar secadora',
      helpText: 'Indicaciones que deja el dueño.',
      required: false,
    },
    {
      key: 'birth_date',
      label: 'Fecha de nacimiento',
      type: 'date',
      helpText: 'Fecha de nacimiento de la mascota.',
      required: false,
    },
    {
      key: 'death_date',
      label: 'Fecha de fallecimiento',
      type: 'date',
      helpText: 'Completa solo si la mascota falleció.',
      required: false,
    },
    {
      key: 'active',
      label: 'Estado',
      helpText: 'Define si la mascota sigue activa en el negocio.',
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
    {
      key: 'created_at',
      label: 'Creado el',
      editable: false,
    },
  ];

  constructor(
    private readonly mascotasService: MascotasService,
    private readonly clientesService: ClientesService,
  ) {}

  async ngOnInit() {
    await this.loadPets();
  }

  private async loadPets(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const [pets, clients] = await Promise.all([
        this.mascotasService.getAll(),
        this.clientesService.getAll(),
      ]);
      this.tableData.set(pets);
      this.columns = this.columns.map((column) =>
        column.key === 'client_id'
          ? { ...column, options: this.toClientOptions(clients) }
          : { ...column },
      );
    } catch (error) {
      console.error('No se pudieron cargar las mascotas.', error);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las mascotas.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async createPet(transaction: TableRow) {
    await this.persist(() => this.mascotasService.create(transaction), 'No se pudo crear la mascota.');
  }

  async deletePet(transaction: TableRow) {
    await this.persist(() => this.mascotasService.remove(transaction), 'No se pudo eliminar la mascota.');
  }

  async updatePet(transaction: TableRow) {
    await this.persist(() => this.mascotasService.update(transaction), 'No se pudo actualizar la mascota.');
  }

  private async persist(action: () => Promise<void>, fallbackMessage: string): Promise<void> {
    try {
      await action();
      await this.loadPets();
    } catch (error) {
      console.error(fallbackMessage, error);
      await this.loadPets();
      this.errorMessage.set(
        error instanceof Error ? error.message : fallbackMessage
      );
    }
  }

  private toClientOptions(clients: Client[]): Array<{ label: string; value: string }> {
    return [
      { label: 'Selecciona un cliente', value: '' },
      ...clients.map((client) => ({
        label:
          `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() ||
          'Cliente sin nombre',
        value: client.id,
      })),
    ];
  }
}
