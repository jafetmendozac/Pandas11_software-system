import { Component, OnInit } from '@angular/core';
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
  tableData: Service[] = [];
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
      key: 'price',
      label: 'Precio',
      type: 'number',
      placeholder: 'Ej. 75',
      helpText: 'Ingresa el precio en soles.',
    },
    {
      key: 'duration_minutes',
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
  ];

  constructor(private readonly serviciosService: ServiciosService) {}

  async ngOnInit() {
    try {
      this.tableData = await this.serviciosService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar los servicios.', error);
    }
  }

  async createService(transaction: TableRow) {
    await this.serviciosService.create(transaction);
  }

  async deleteService(transaction: TableRow) {
    await this.serviciosService.remove(transaction);
  }

  async updateService(transaction: TableRow) {
    await this.serviciosService.update(transaction);
  }
}
