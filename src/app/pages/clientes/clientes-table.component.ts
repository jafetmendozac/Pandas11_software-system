import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ComponentCardComponent } from "../../shared/components/common/component-card/component-card.component";
import { PersonalizedTable } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Transaction } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
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
  transactionData: Transaction[] = [
    {
      image: '/images/brand/brand-08.svg', action: 'John Doe', date: '2024-06-15', amount: '555-0101', category: 'john@example.com', status: 'Success'
    },
    {
      image: '/images/brand/brand-07.svg', action: 'Jane Smith', date: '2024-06-18', amount: '555-0102', category: 'jane@example.com', status: 'Pending'
    },
  ];

  constructor(private readonly clientesService: ClientesService) {}

  async ngOnInit() {
    try {
      this.transactionData = await this.clientesService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar los clientes.', error);
    }
  }

  async createClient(transaction: Transaction) {
    await this.clientesService.create(transaction);
  }

  async deleteClient(transaction: Transaction) {
    await this.clientesService.remove(transaction);
  }

  async updateClient(transaction: Transaction) {
    await this.clientesService.update(transaction);
  }
}
