import { Component, OnInit } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Transaction } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
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
  transactionData: Transaction[] = [];

  constructor(private readonly serviciosService: ServiciosService) {}

  async ngOnInit() {
    try {
      this.transactionData = await this.serviciosService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar los servicios.', error);
    }
  }

  async createService(transaction: Transaction) {
    await this.serviciosService.create(transaction);
  }

  async deleteService(transaction: Transaction) {
    await this.serviciosService.remove(transaction);
  }

  async updateService(transaction: Transaction) {
    await this.serviciosService.update(transaction);
  }
}
