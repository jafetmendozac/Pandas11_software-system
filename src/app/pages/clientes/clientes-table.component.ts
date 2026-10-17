import { ChangeDetectorRef, Component, Input, ViewChild, OnInit, inject } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Client, ClientesService, PageQuery } from '../../shared/services/clientes.service';
import { ProfilesService, profileLabel } from '../../shared/services/profiles.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { RecordDetailsComponent } from '../../shared/components/records/record-details/record-details.component';
@Component({ selector: 'app-clientes-table', standalone: true,
    imports: [PageBreadcrumbComponent, ComponentCardComponent, PersonalizedTable, RecordDetailsComponent],
    templateUrl: './clientes-table.component.html' })
export class ClientesTableComponent implements OnInit {
    @Input()
    selfService = false;
    @ViewChild('clientsTable')
    clientsTable?: PersonalizedTable;
    readonly authorization = inject(AuthorizationService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly clients = inject(ClientesService);
    private readonly pets = inject(MascotasService);
    private readonly profiles = inject(ProfilesService);
    tableData: Client[] = [];
    total = 0;
    archived = false;
    loading = false;
    errorMessage = '';
    selectedClient: Client | null = null;
    selectedPet: Pet | null = null;
    selectedClientPets: Pet[] = [];
    petsErrorMessage = '';
    petsTotal = 0;
    query: PageQuery = { search: '', page: 1, size: 5 };
    petQuery: PageQuery = { search: '', page: 1, size: 5 };
    private revision = 0;
    private petRevision = 0;
    petColumns: TableColumn[] = [
        { key: 'name', label: 'Nombre', placeholder: 'Ej. Max' },
        { key: 'breed', label: 'Raza', placeholder: 'Ej. Pomerania', required: false },
        {
            key: 'pet_sex', label: 'Sexo', required: false, options: [
                { label: 'No especificado', value: '' },
                { label: 'Macho', value: 'MALE' },
                { label: 'Hembra', value: 'FEMALE' },
                { label: 'Desconocido', value: 'UNKNOWN' },
            ],
        },
        {
            key: 'pet_size', label: 'Tamaño', required: false, options: [
                { label: 'No especificado', value: '' },
                { label: 'Miniatura', value: 'TOY' },
                { label: 'Pequeño', value: 'SMALL' },
                { label: 'Mediano', value: 'MEDIUM' },
                { label: 'Grande', value: 'LARGE' },
                { label: 'Extra grande', value: 'EXTRA_LARGE' },
            ],
        },
        { key: 'weight_kg', label: 'Peso (kg)', type: 'number', required: false },
        { key: 'allergies', label: 'Alergias', required: false, options: [{ label: 'No', value: 'false' }, { label: 'Sí', value: 'true' }] },
        {
            key: 'bites', label: 'Muerde', required: false, options: [
                { label: 'No', value: 'false' },
                { label: 'Sí', value: 'true' },
            ],
        },
        { key: 'client_notes', label: 'Notas', required: false },
        { key: 'birth_date', label: 'Nacimiento', type: 'date', required: false },
        { key: 'active', label: 'Estado', options: [
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' },
            ] },
    ];
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
    async toggleArchive(): Promise<void> { this.archived = !this.archived; this.closePets(); if (this.clientsTable)
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
    async openPets(row: TableRow): Promise<void> { this.selectedClient = row as Client; this.selectedPet = null; this.petQuery = { search: '', page: 1, size: 5 }; await this.loadPets(); }
    closePets(): void { this.petRevision++; this.selectedClient = null; this.selectedPet = null; this.selectedClientPets = []; }
    async loadPets(query = this.petQuery): Promise<void> {
        this.petQuery = query;
        const revision = ++this.petRevision;
        const id = this.selectedClient?.id;
        if (!id)
            return;
        this.petsErrorMessage = '';
        try {
            const result = await this.pets.search(query, this.archived, id);
            if (revision === this.petRevision && id === this.selectedClient?.id) {
                this.selectedClientPets = result.rows;
                this.petsTotal = result.total;
            }
        }
        catch (error) {
            if (revision === this.petRevision)
                this.petsErrorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las mascotas.';
        } finally { this.cdr.markForCheck(); }
    }
    readonly savePet = async (row: TableRow, mode: 'create' | 'update' | 'delete'): Promise<void> => {
        if (this.selfService || this.archived || !this.authorization.has('pets.manage'))
            throw new Error('Operación no permitida.');
        const pet = { ...row, client_id: this.selectedClient?.id };
        await (mode === 'create' ? this.pets.create(pet) : mode === 'update' ? this.pets.update(pet) : this.pets.remove(pet));
        this.selectedPet = null;
        await this.loadPets();
    };
    selectPet(row: TableRow): void { this.selectedPet = row as Pet; }
    get selectedClientName(): string { return `${this.selectedClient?.first_name ?? ''} ${this.selectedClient?.last_name ?? ''}`.trim(); }
}
