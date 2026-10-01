import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { ComponentCardComponent } from "../../shared/components/common/component-card/component-card.component";
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Client, ClientesService } from '../../shared/services/clientes.service';
import { Profile, ProfilesService, profileLabel } from '../../shared/services/profiles.service';


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
  tableData: Client[] = [];
  errorMessage = '';
  profiles: Profile[] = [];
  columns: TableColumn[] = [
    {
      key: 'profile_id',
      label: 'Perfil relacionado',
      helpText: 'Une este cliente con un perfil existente.',
      required: false,
      options: [],
    },
    {
      key: 'first_name',
      label: 'Nombre',
      placeholder: 'Ej. María',
      helpText: 'Nombre del cliente.',
    },
    {
      key: 'last_name',
      label: 'Apellido',
      placeholder: 'Ej. García',
      helpText: 'Apellido del cliente.',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      placeholder: 'Ej. 999 999 999',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      placeholder: 'Ej. 999 999 999',
    },
    {
      key: 'email',
      label: 'Correo electrónico',
      type: 'text',
      placeholder: 'Ej. cliente@correo.com',
    },
    {
      key: 'address',
      label: 'Dirección',
      placeholder: 'Ej. Av. Principal 123',
    },
    {
      key: 'tax_doc_type',
      label: 'Tipo de documento',
      options: [
        { label: 'DNI', value: 'DNI' },
        { label: 'RUC', value: 'RUC' },
        { label: 'Carné de extranjería', value: 'CE' },
        { label: 'Pasaporte', value: 'PASSPORT' },
      ],
    },
    {
      key: 'tax_doc_number',
      label: 'N.º de documento',
      placeholder: 'Ej. 12345678',
    },
    {
      key: 'business_name',
      label: 'Razón social',
      placeholder: 'Opcional',
      required: false,
    },
    {
      key: 'whatsapp_opt_in',
      label: 'Mensajes x WhatsApp',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  ];

  constructor(
    private readonly clientesService: ClientesService,
    private readonly profilesService: ProfilesService,
  ) {}

  async ngOnInit() {
    await this.loadClients();
  }

  private async loadClients(): Promise<void> {
    try {
      const [clients, profiles] = await Promise.all([
        this.clientesService.getAll(),
        this.profilesService.getAll(),
      ]);
      this.tableData = clients;
      this.profiles = profiles;
      this.columns = this.columns.map((column) =>
        column.key === 'profile_id'
          ? {
              ...column,
              options: [
                { label: 'Sin perfil', value: '' },
                ...profiles.map((profile) => ({
                  label: profileLabel(profile),
                  value: profile.id,
                })),
              ],
            }
          : column,
      );
    } catch (error) {
      console.error('No se pudieron cargar los clientes.', error);
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudieron cargar los clientes.';
    }
  }

  async createClient(transaction: TableRow) {
    await this.clientesService.create(transaction);
    await this.loadClients();
  }

  async deleteClient(transaction: TableRow) {
    await this.clientesService.remove(transaction);
    await this.loadClients();
  }

  async updateClient(transaction: TableRow) {
    await this.clientesService.update(transaction);
    await this.loadClients();
  }
}
