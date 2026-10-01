import { Component, OnInit, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Service, ServiciosService } from '../../shared/services/servicios.service';

@Component({
  selector: 'app-servicios',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    PersonalizedTable,
  ],
  templateUrl: './servicios.component.html',
  styles: ``
})
export class ServiciosComponent implements OnInit {
  tableData = signal<Service[]>([]);
  errorMessage = signal('');
  loading = signal(true);

  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Nombre',
      placeholder: 'Ej. Baño completo',
      helpText: 'Escribe el nombre que verá el cliente.',
    },
    {
      key: 'description',
      label: 'Descripción',
      placeholder: 'Ej. Baño, secado y cepillado',
      helpText: 'Describe brevemente qué incluye el servicio.',
    },
    {
      key: 'base_price',
      label: 'Precio',
      type: 'number',
      placeholder: 'Ej. 75',
      helpText: 'Ingresa el precio en soles.',
    },
    {
      key: 'base_duration_minutes',
      label: 'Duración (min)',
      type: 'number',
      placeholder: 'Ej. 60',
      helpText: 'Indica la duración aproximada en minutos.',
    },
    {
      key: 'requires_specialist',
      label: 'Especialidad',
      helpText: 'Define quién puede realizar este servicio.',
      options: [
        { label: 'Cualquier empleado', value: 'false' },
        { label: 'Solo el principal', value: 'true' },
      ],
    },
    {
      key: 'active',
      label: 'Estado',
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
    {
      key: 'visible_to_clients',
      label: 'Visible para clientes',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  ];

  constructor(private readonly serviciosService: ServiciosService) {}

  async ngOnInit() {
    await this.loadServices();
  }

  private async loadServices(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const data = await this.serviciosService.getAll();
      this.tableData.set(data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudieron cargar los servicios.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async createService(transaction: TableRow) {
    await this.serviciosService.create(transaction);
    await this.loadServices();
  }

  async deleteService(transaction: TableRow) {
    await this.serviciosService.remove(transaction);
    await this.loadServices();
  }

  async updateService(transaction: TableRow) {
    await this.serviciosService.update(transaction);
    await this.loadServices();
  }
}