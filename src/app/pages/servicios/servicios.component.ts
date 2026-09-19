import { Component, OnInit } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { ServiciosService } from '../../shared/services/servicios.service';

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
  tableData: TableRow[] = [];
  columns: TableColumn[] = [
    { key: 'action', label: 'Name' },
    { key: 'category', label: 'Description' },
    { key: 'amount', label: 'Price', type: 'number' },
    { key: 'date', label: 'Duration', type: 'number' },
    {
      key: 'type',
      label: 'Type',
      options: [
        { label: 'General', value: 'General' },
        { label: 'Specialist', value: 'Specialist' },
      ],
    },
    { key: 'account', label: 'State' },
    { key: 'status', label: 'Status' },
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
