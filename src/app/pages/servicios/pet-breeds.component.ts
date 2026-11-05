import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { PetBreed, PetBreedsService } from '../../shared/services/pet-breeds.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import type { PageQuery } from '../../shared/services/clientes.service';

@Component({ selector: 'app-pet-breeds', standalone: true, imports: [ComponentCardComponent, PageBreadcrumbComponent, PersonalizedTable], templateUrl: './pet-breeds.component.html' })
export class PetBreedsComponent implements OnInit {
  readonly authorization = inject(AuthorizationService);
  private readonly breeds = inject(PetBreedsService);
  @ViewChild('table') table?: PersonalizedTable;
  readonly tableData = signal<PetBreed[]>([]); readonly total = signal(0); readonly loading = signal(false); readonly errorMessage = signal('');
  private query: PageQuery = { search: '', page: 1, size: 5 }; private revision = 0;

  columns: TableColumn[] = [
    {
      key: 'name', label: 'Raza', required: true,
      helpText: 'Nombre de la raza (ej. Shitzu, Poodle, Labrador).',
    },
    {
      key: 'active', label: 'Activa',
      helpText: '¿Está disponible para usar en mascotas y tarifas?',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadBreeds();
  }

  async loadBreeds(query = this.query): Promise<void> {
    this.query = query; const revision = ++this.revision; this.loading.set(true); this.errorMessage.set('');
    try {
      const result = await this.breeds.search(query);
      if (revision === this.revision) {
        this.tableData.set(result.rows); this.total.set(result.total);
      }
    } catch (error) {
      if (revision === this.revision) this.errorMessage.set(error instanceof Error ? error.message : 'No se pudieron cargar las razas.');
    } finally {
      if (revision === this.revision) this.loading.set(false);
    }
  }

  readonly saveBreed = async (row: TableRow, mode: 'create' | 'update' | 'delete'): Promise<void> => {
    if (!this.authorization.has('service_prices.manage')) throw new Error('No tienes permiso para administrar razas.');
    await (mode === 'create' ? this.breeds.create(row) : mode === 'update' ? this.breeds.update(row) : this.breeds.remove(row));
    if (mode !== 'update') { this.query = { ...this.query, page: 1 }; if (this.table) this.table.currentPage = 1; }
    await this.loadBreeds();
  };
}
