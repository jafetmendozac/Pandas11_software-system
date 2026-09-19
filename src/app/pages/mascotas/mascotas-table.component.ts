import { Component, OnInit } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
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
  tableData: TableRow[] = [];
  columns: TableColumn[] = [
    { key: 'action', label: 'Name' },
    { key: 'category', label: 'Breed' },
    {
      key: 'type',
      label: 'Size',
      options: [
        { label: 'Small', value: 'SMALL' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Large', value: 'LARGE' },
        { label: 'Extra large', value: 'EXTRA_LARGE' },
      ],
    },
    { key: 'amount', label: 'Weight', type: 'number' },
    { key: 'account', label: 'Allergies' },
    {
      key: 'method',
      label: 'Sex',
      options: [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Unknown', value: 'UNKNOWN' },
      ],
    },
    { key: 'status', label: 'Status' },
  ];

  constructor(private readonly mascotasService: MascotasService) {}

  async ngOnInit() {
    try {
      this.tableData = await this.mascotasService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar las mascotas.', error);
    }
  }

  async createPet(transaction: TableRow) {
    await this.mascotasService.create(transaction);
  }

  async deletePet(transaction: TableRow) {
    await this.mascotasService.remove(transaction);
  }

  async updatePet(transaction: TableRow) {
    await this.mascotasService.update(transaction);
  }

}
