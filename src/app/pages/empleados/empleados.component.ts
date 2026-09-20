import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { ProfilesService } from '../../shared/services/profiles.service';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [PageBreadcrumbComponent, ComponentCardComponent, PersonalizedTable],
  templateUrl: './empleados.component.html',
})
export class EmpleadosComponent implements OnInit {
  tableData: TableRow[] = [];
  columns: TableColumn[] = [
    { key: 'id', label: 'Auth user UUID' },
    { key: 'first_name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellidos' },
    {
      key: 'role',
      label: 'Rol',
      options: [
        { label: 'Todos los servicios', value: 'ALL_SERVICES' },
        { label: 'Asistente', value: 'ASSISTANT' },
      ],
    },
    {
      key: 'active',
      label: 'Activo',
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
  ];

  constructor(private readonly profilesService: ProfilesService) {}

  async ngOnInit(): Promise<void> {
    await this.loadProfiles();
  }

  async createProfile(row: TableRow): Promise<void> {
    await this.profilesService.create(row);
    await this.loadProfiles();
  }

  async updateProfile(row: TableRow): Promise<void> {
    await this.profilesService.update(row);
    await this.loadProfiles();
  }

  async deleteProfile(row: TableRow): Promise<void> {
    await this.profilesService.remove(row);
    await this.loadProfiles();
  }

  private async loadProfiles(): Promise<void> {
    try {
      this.tableData = await this.profilesService.getAll();
    } catch (error) {
      console.error('No se pudieron cargar los empleados.', error);
    }
  }
}
