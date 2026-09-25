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
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'price', label: 'Precio', type: 'number' },
    { key: 'duration_minutes', label: 'Duración (min)', type: 'number' },
    {
      key: 'requires_specialist',
      label: 'Principal',
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
