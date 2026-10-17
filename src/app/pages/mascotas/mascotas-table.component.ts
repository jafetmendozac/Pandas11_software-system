import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { ClientesService, PageQuery } from '../../shared/services/clientes.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { RecordDetailsComponent } from '../../shared/components/records/record-details/record-details.component';
@Component({ selector: 'app-mascotas-table', standalone: true,
    imports: [ComponentCardComponent, PageBreadcrumbComponent, PersonalizedTable, RecordDetailsComponent], templateUrl: './mascotas-table.component.html' })
export class MascotasTableComponent implements OnInit {
    readonly authorization = inject(AuthorizationService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly pets = inject(MascotasService);
    private readonly clients = inject(ClientesService);
    @ViewChild('petsTable')
    petsTable?: PersonalizedTable;
    tableData: Pet[] = [];
    total = 0;
    archived = false;
    errorMessage = '';
    loading = false;
    selectedPet: Pet | null = null;
    query: PageQuery = { search: '', page: 1, size: 5 };
    private revision = 0;
    columns: TableColumn[] = [
        {
            key: 'name',
            label: 'Nombre',
            placeholder: 'Ej. Max',
            helpText: 'Escribe el nombre de la mascota.',
        },
        {
            key: 'client_id', createOnly: true,
            label: 'Cliente',
            helpText: 'Selecciona el dueño de la mascota.',
            options: [],
        },
        {
            key: 'breed',
            label: 'Raza',
            placeholder: 'Ej. Pomerania',
            helpText: 'Indica la raza, si la conoces.',
            required: false,
        },
        {
            key: 'pet_sex',
            label: 'Sexo',
            helpText: 'Define el sexo de la mascota.',
            required: false,
            options: [
                { label: 'No especificado', value: '' },
                { label: 'Macho', value: 'MALE' },
                { label: 'Hembra', value: 'FEMALE' },
                { label: 'Desconocido', value: 'UNKNOWN' },
            ],
        },
        {
            key: 'pet_size',
            label: 'Tamaño',
            helpText: 'Define el tamaño de la mascota.',
            required: false,
            options: [
                { label: 'No especificado', value: '' },
                { label: 'Miniatura', value: 'TOY' },
                { label: 'Pequeño', value: 'SMALL' },
                { label: 'Mediano', value: 'MEDIUM' },
                { label: 'Grande', value: 'LARGE' },
                { label: 'Extra grande', value: 'EXTRA_LARGE' },
            ],
        },
        {
            key: 'pet_coat_type',
            label: 'Tipo de pelo',
            helpText: 'Define el pelaje de la mascota.',
            required: false,
            options: [
                { label: 'No especificado', value: '' },
                { label: 'Corto', value: 'SHORT' },
                { label: 'Medio', value: 'MEDIUM' },
                { label: 'Largo', value: 'LONG' },
                { label: 'Cerda', value: 'WIRE' },
                { label: 'Rizado', value: 'CURLY' },
                { label: 'Sin pelo', value: 'HAIRLESS' },
            ],
        },
        {
            key: 'weight_kg',
            label: 'Peso (kg)',
            type: 'number',
            placeholder: 'Ej. 4.5',
            helpText: 'Ingresa el peso en kilogramos.',
            required: false,
        },
        {
            key: 'allergies',
            label: 'Alergias',
            options: [{ label: 'No', value: 'false' }, { label: 'Sí', value: 'true' }],
            helpText: 'Indica si tiene alergias. Los detalles se registran en notas internas.',
            required: false,
        },
        {
            key: 'bites',
            label: 'Muerde',
            helpText: 'Indica si la mascota tiende a morder.',
            required: false,
            options: [
                { label: 'No', value: 'false' },
                { label: 'Sí', value: 'true' },
            ],
        },
        {
            key: 'client_notes',
            label: 'Notas del cliente',
            placeholder: 'Ej. No usar secadora',
            helpText: 'Indicaciones que deja el dueño.',
            required: false,
        },
        {
            key: 'birth_date',
            label: 'Fecha de nacimiento',
            type: 'date',
            helpText: 'Fecha de nacimiento de la mascota.',
            required: false,
        },
        {
            key: 'death_date',
            label: 'Fecha de fallecimiento',
            type: 'date',
            helpText: 'Completa solo si la mascota falleció.',
            required: false,
        },
        {
            key: 'active',
            label: 'Estado',
            helpText: 'Define si la mascota sigue activa en el negocio.',
            options: [
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' },
            ],
        },
        {
            key: 'created_at',
            label: 'Creado el',
            editable: false,
        },
    ];
    async ngOnInit(): Promise<void> {
        if (this.authorization.has('pets.manage')) {
            try {
                const clients = await this.clients.getAll();
                this.columns = this.columns.map(c => c.key === 'client_id' ? { ...c, options: [{ label: 'Selecciona un cliente', value: '' }, ...clients.map(client => ({ label: `${client.first_name} ${client.last_name ?? ''}`, value: client.id }))] } : c);
            }
            catch {
                this.errorMessage = 'No se pudieron cargar los clientes.';
            }
        }
        await this.loadPets();
    }
    async loadPets(query = this.query): Promise<void> {
        this.query = query;
        const revision = ++this.revision;
        this.loading = true;
        this.errorMessage = '';
        try {
            const result = await this.pets.search(query, this.archived);
            if (revision === this.revision) {
                this.tableData = result.rows;
                this.total = result.total;
            }
        }
        catch (error) {
            if (revision === this.revision)
                this.errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar las mascotas.';
        }
        finally {
            if (revision === this.revision)
                this.loading = false;
            this.cdr.markForCheck();
        }
    }
    async toggleArchive(): Promise<void> { this.archived = !this.archived; this.selectedPet = null; if (this.petsTable)
        this.petsTable.currentPage = 1; await this.loadPets({ ...this.query, page: 1 }); }
    selectPet(row: TableRow): void { this.selectedPet = row as Pet; }
    readonly savePet = async (row: TableRow, mode: 'create' | 'update' | 'delete'): Promise<void> => {
        if (this.archived || !this.authorization.has('pets.manage'))
            throw new Error('Operación no permitida.');
        await (mode === 'create' ? this.pets.create(row) : mode === 'update' ? this.pets.update(row) : this.pets.remove(row));
        this.selectedPet = null;
        if (mode !== 'update') {
            this.query = { ...this.query, page: 1 };
            if (this.petsTable)
                this.petsTable.currentPage = 1;
        }
        await this.loadPets();
    };
}
