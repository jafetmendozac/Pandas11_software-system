import { Component, OnInit, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Employee, EmpleadosService } from '../../shared/services/empleados.service';
import { Profile, ProfilesService, profileLabel } from '../../shared/services/profiles.service';

@Component({
  selector: 'app-empleados',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    PersonalizedTable,
  ],
  templateUrl: './empleados.component.html',
  styles: ``
})
export class EmpleadosComponent implements OnInit {
  tableData = signal<Employee[]>([]);
  errorMessage = signal('');
  loading = signal(true);

  columns: TableColumn[] = [
    {
      key: 'profile_id',
      label: 'Empleado',
      helpText: 'Selecciona el perfil de la persona que trabajará en el negocio.',
      options: [],
    },
    {
      key: 'phone',
      label: 'Teléfono',
      placeholder: 'Ej. 987 654 321',
      helpText: 'Ingresa el teléfono de contacto del empleado.',
    },
    {
      key: 'skill_level',
      label: 'Nivel',
      helpText: 'Define qué servicios puede realizar.',
      options: [
        { label: 'Todos los servicios', value: 'ALL_SERVICES' },
        { label: 'Asistente', value: 'ASSISTANT' },
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

  constructor(
    private readonly empleadosService: EmpleadosService,
    private readonly profilesService: ProfilesService,
  ) {}

  async ngOnInit() {
    await this.loadEmpleados();
  }

  private async loadEmpleados(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const [employees, profiles] = await Promise.all([
        this.empleadosService.getAll(),
        this.profilesService.getAll(),
      ]);
      this.tableData.set(employees);
      this.columns = this.columns.map((column) =>
        column.key === 'profile_id'
          ? { ...column, options: this.toProfileOptions(profiles) }
          : { ...column },
      );
    } catch (error) {
      console.error('Error cargando empleados:', error);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'No se pudieron cargar los empleados.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async createEmployee(transaction: TableRow) {
    await this.empleadosService.create(transaction);
    await this.loadEmpleados();
  }

  async deleteEmployee(transaction: TableRow) {
    await this.empleadosService.remove(transaction);
    await this.loadEmpleados();
  }

  async updateEmployee(transaction: TableRow) {
    await this.empleadosService.update(transaction);
    await this.loadEmpleados();
  }

  private toProfileOptions(profiles: Profile[]): Array<{ label: string; value: string }> {
    return profiles.map((profile) => ({
      label: profileLabel(profile),
      value: profile.id,
    }));
  }
}
