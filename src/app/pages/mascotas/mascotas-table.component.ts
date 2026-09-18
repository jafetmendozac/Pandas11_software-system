import { Component, OnInit } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Transaction } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { MascotasService } from '../../shared/services/mascotas.service';


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
  transactionData: Transaction[] = [];

  constructor(private readonly mascotasService: MascotasService) {}

  async ngOnInit() {
    try {
      this.transactionData = await this.mascotasService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar las mascotas.', error);
    }
  }

  async createPet(transaction: Transaction) {
    await this.mascotasService.create(transaction);
  }

  async deletePet(transaction: Transaction) {
    await this.mascotasService.remove(transaction);
  }

  async updatePet(transaction: Transaction) {
    await this.mascotasService.update(transaction);
  }

}
