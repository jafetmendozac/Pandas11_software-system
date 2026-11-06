import { ChangeDetectorRef, Component, Input, ViewChild, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Client, ClientesService, PageQuery } from '../../shared/services/clientes.service';
import { ProfilesService, profileLabel } from '../../shared/services/profiles.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
@Component({ selector: 'app-clientes-table', standalone: true,
    imports: [PageBreadcrumbComponent, ComponentCardComponent, PersonalizedTable],
    templateUrl: './clientes-table.component.html' })
export class ClientesTableComponent implements OnInit {
    @Input()
    selfService = false;
    @ViewChild('clientsTable')
    clientsTable?: PersonalizedTable;
    readonly authorization = inject(AuthorizationService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly clients = inject(ClientesService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly profiles = inject(ProfilesService);
    tableData: Client[] = [];
    total = 0;
    archived = false;
    loading = false;
    errorMessage = '';
    query: PageQuery = { search: '', page: 1, size: 10 };
    private revision = 0;
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
            key: 'last_name', required: false,
            label: 'Apellido',
            placeholder: 'Ej. García',
            helpText: 'Apellido del cliente.',
        },
        {
            key: 'phone', required: false,
            label: 'Teléfono',
            placeholder: 'Ej. 999 999 999',
        },
        {
            key: 'whatsapp', required: false,
            label: 'WhatsApp',
            placeholder: 'Ej. 999 999 999',
        },
        {
            key: 'email', required: false,
            label: 'Correo electrónico',
            type: 'text',
            placeholder: 'Ej. cliente@correo.com',
        },
        {
            key: 'address', required: false,
            label: 'Dirección',
            placeholder: 'Ej. Av. Principal 123',
        },
        {
            key: 'tax_doc_type', required: false,
            label: 'Tipo de documento',
            options: [
                { label: 'Sin documento', value: '' },
                { label: 'DNI', value: 'DNI' },
                { label: 'RUC', value: 'RUC' },
                { label: 'Carné de extranjería', value: 'CE' },
                { label: 'Pasaporte', value: 'PASSPORT' },
            ],
        },
        {
            key: 'tax_doc_number', required: false,
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
    async ngOnInit(): Promise<void> {
        const page = Number(this.route.snapshot.queryParamMap.get('page'));
        this.archived = this.route.snapshot.queryParamMap.get('archived') === '1';
        this.query = { search: this.route.snapshot.queryParamMap.get('q') ?? '', page: Number.isInteger(page) && page > 0 ? page : 1, size: 10 };
        if (this.authorization.has('profiles.read')) {
            try {
                const profiles = await this.profiles.getAll();
                this.columns = this.columns.map(c => c.key === 'profile_id' ? { ...c, options: [{ label: 'Sin perfil', value: '' }, ...profiles.map(p => ({ label: profileLabel(p), value: p.id }))] } : c);
            }
            catch {
                this.errorMessage = 'No se pudieron cargar los perfiles vinculables.';
            }
        }
        else
            this.columns = this.columns.filter(c => c.key !== 'profile_id');
        await this.loadClients();
    }
    async loadClients(query = this.query): Promise<void> {
        this.query = query;
        const revision = ++this.revision;
        this.loading = true;
        this.errorMessage = '';
        try {
            const result = await (this.selfService ? this.clients.own(query) : this.clients.search(query, this.archived));
            if (revision === this.revision) {
                this.tableData = result.rows;
                this.total = result.total;
            }
        }
        catch (error) {
            if (revision === this.revision)
                this.errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los clientes.';
        }
        finally {
            if (revision === this.revision)
                this.loading = false;
            this.cdr.markForCheck();
        }
    }
    async toggleArchive(): Promise<void> { this.archived = !this.archived; if (this.clientsTable)
        this.clientsTable.currentPage = 1; await this.loadClients({ ...this.query, page: 1 }); }
    readonly saveClient = async (row: TableRow, mode: 'create' | 'update' | 'delete'): Promise<void> => {
        if (this.selfService || this.archived || !this.authorization.has('clients.manage'))
            throw new Error('Operación no permitida.');
        await (mode === 'create' ? this.clients.create(row) : mode === 'update' ? this.clients.update(row) : this.clients.remove(row));
        if (mode !== 'update') {
            this.query = { ...this.query, page: 1 };
            if (this.clientsTable)
                this.clientsTable.currentPage = 1;
        }
        await this.loadClients();
    };
    openPets(row: TableRow): void {
        const client = row as Client;
        void this.router.navigate(['/clientes', client.id], { queryParams: { q: this.query.search || undefined, page: this.query.page, archived: this.archived ? '1' : undefined } });
    }
}
