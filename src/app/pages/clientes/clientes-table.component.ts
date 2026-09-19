import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ComponentCardComponent } from "../../shared/components/common/component-card/component-card.component";
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { ClientesService } from '../../shared/services/clientes.service';


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
  tableData: TableRow[] = [];
  columns: TableColumn[] = [
    { key: 'action', label: 'Name' },
    { key: 'amount', label: 'Phone' },
    { key: 'category', label: 'Email' },
    { key: 'account', label: 'Address' },
  ];

  constructor(private readonly clientesService: ClientesService) {}

  async ngOnInit() {
    try {
      this.tableData = await this.clientesService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar los clientes.', error);
    }
  }

  async createClient(transaction: TableRow) {
    await this.clientesService.create(transaction);
  }

  async deleteClient(transaction: TableRow) {
    await this.clientesService.remove(transaction);
  }

  async updateClient(transaction: TableRow) {
    await this.clientesService.update(transaction);
  }
}
