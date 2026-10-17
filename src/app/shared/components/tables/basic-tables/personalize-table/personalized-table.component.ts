import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Optional, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../ui/button/button.component';
import { TableDropdownComponent } from '../../../common/table-dropdown/table-dropdown.component';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { ModalComponent } from '../../../ui/modal/modal.component';
import { CustomSelectComponent } from '../../../form/custom-select/custom-select.component';
export type TableRow = Record<string, unknown>;

export interface TableColumn {
  key: string;
  label: string;
  editable?: boolean;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  type?: 'text' | 'number' | 'date';
  createOnly?: boolean;
  options?: Array<{ label: string; value: string }>;
}

type PaginationItem = number | 'ellipsis';

@Component({
  selector: 'app-personalized-table',
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    TableDropdownComponent,
    BadgeComponent,
    ModalComponent,
    CustomSelectComponent,
  ],
  templateUrl: './personalized-table.component.html',
  styles: ``
})
export class PersonalizedTable {
  constructor(@Optional() private readonly cdr?: ChangeDetectorRef) {}
  @Input() serverTotal: number | null = null;
  @Input() saveAction?: (row: TableRow, mode: 'create' | 'update' | 'delete') => Promise<void>;
  @Output() queryChanged = new EventEmitter<{ search: string; page: number; size: number }>();
  pending = false;
  formError = '';
  @Input() title = 'Datos';
  @Input() addLabel = 'Añadir registro';
  @Input() createTitle = 'Añadir registro';
  @Input() editTitle = 'Editar registro';
  @Input() allowCreate = true;
  @Input() allowEdit = true;
  @Input() allowDelete = true;
  @Input() itemsPerPageOptions: number[] = [5, 10, 15];
  @Input() columns: TableColumn[] = [];
  @Input() tableData: TableRow[] = [];
  @Input() searchKey = '';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() detailsLabel = '';

  @Output() rowCreated = new EventEmitter<TableRow>();
  @Output() rowUpdated = new EventEmitter<TableRow>();
  @Output() rowDeleted = new EventEmitter<TableRow>();
  @Output() rowDetails = new EventEmitter<TableRow>();

  currentPage = 1;
  itemsPerPage = 5;
  searchTerm = '';
  isFormOpen = false;
  editingIndex: number | null = null;
  formData: TableRow = {};

  get totalPages(): number {
    return Math.ceil((this.serverTotal ?? this.filteredTableData.length) / this.itemsPerPage);
  }

  get filteredTableData(): TableRow[] {
    if (this.serverTotal !== null) return this.tableData;
    const term = this.searchTerm.trim().toLocaleLowerCase();
    if (!term || !this.searchKey) return this.tableData;

    return this.tableData.filter((row) =>
      String(row[this.searchKey] ?? '').toLocaleLowerCase().includes(term),
    );
  }

  get paginationItems(): PaginationItem[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }
    if (this.currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', this.totalPages];
    }
    if (this.currentPage >= this.totalPages - 3) {
      return [1, 'ellipsis', this.totalPages - 4, this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages];
    }
    return [1, 'ellipsis', this.currentPage - 1, this.currentPage, this.currentPage + 1, 'ellipsis', this.totalPages];
  }

  get currentItems(): TableRow[] {
    if (this.serverTotal !== null) return this.tableData;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTableData.slice(start, start + this.itemsPerPage);
  }

  get firstItemIndex(): number {
    return (this.serverTotal ?? this.filteredTableData.length) === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get lastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.serverTotal ?? this.filteredTableData.length);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.emitQuery();
  }

  get editableColumns(): TableColumn[] {
    return this.columns.filter((column) => column.editable !== false && !(column.createOnly && this.editingIndex !== null));
  }

  get hasStatusColumn(): boolean {
    return this.columns.some((column) => column.key === 'status');
  }

  getCellValue(row: TableRow, key: string, column?: TableColumn): string {
    const value = row[key];
    if (column?.options?.length) {
      const selectedOption = column.options.find((option) => String(option.value) === String(value ?? ''));
      return selectedOption?.label ?? String(value ?? '');
    }
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return String(value ?? '');
  }

  getFormValue(key: string): string {
    return String(this.formData[key] ?? '');
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.emitQuery(); }
  }

  onItemsPerPageChange(value: string | number | null): void {
    if (value !== null) {
      this.itemsPerPage = Number(value);
      this.currentPage = 1;
      this.emitQuery();
    }
  }

  private emitQuery(): void {
    if (this.serverTotal !== null) this.queryChanged.emit({ search: this.searchTerm, page: this.currentPage, size: this.itemsPerPage });
  }

  openCreateForm(): void {
    if (this.pending || !this.allowCreate) return;
    this.formError = '';
    this.editingIndex = null;
    this.formData = this.createEmptyRow();
    this.isFormOpen = true;
  }

  openEditForm(row: TableRow): void {
    if (this.pending || !this.allowEdit) return;
    this.formError = '';
    this.editingIndex = this.tableData.indexOf(row);
    this.formData = { ...row };
    this.isFormOpen = true;
  }

  closeForm(): void {
    if (!this.pending) this.isFormOpen = false;
  }

  async saveRow(): Promise<void> {
    if (this.pending) return;
    if (this.editingIndex === null ? !this.allowCreate : !this.allowEdit) return;
    this.formError = '';
    for (const column of this.editableColumns) {
      const value = this.formData[column.key];
      if (column.required !== false && !String(value ?? '').trim()) { this.formError = `Completa ${column.label}.`; return; }
      if (column.type === 'number' && String(value ?? '').trim() && !Number.isFinite(Number(value))) { this.formError = `Revisa ${column.label}.`; return; }
    }
    if (this.saveAction) {
      this.pending = true;
      try { await this.saveAction({ ...this.formData }, this.editingIndex === null ? 'create' : 'update'); this.isFormOpen = false; }
      catch (error) { this.formError = error instanceof Error ? error.message : 'No se pudo guardar.'; }
      finally { this.pending = false; this.cdr?.markForCheck(); }
      return;
    }
    const row = { ...this.formData };
    if (this.editingIndex === null) {
      this.tableData = [row, ...this.tableData];
      this.currentPage = 1;
      this.rowCreated.emit(row);
    } else {
      this.tableData[this.editingIndex] = row;
      this.rowUpdated.emit(row);
    }
    this.closeForm();
  }

  async handleDelete(row: TableRow): Promise<void> {
    if (this.pending || !this.allowDelete) return;
    const firstColumn = this.columns[0]?.key;
    const label = firstColumn ? this.getCellValue(row, firstColumn) : 'this row';
    if (!window.confirm(`¿Eliminar ${label}?`)) return;
    if (this.saveAction) {
      this.pending = true;
      try { await this.saveAction(row, 'delete'); }
      catch (error) { this.formError = error instanceof Error ? error.message : 'No se pudo retirar.'; }
      finally { this.pending = false; this.cdr?.markForCheck(); }
      return;
    }
    this.tableData = this.tableData.filter((item) => item !== row);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.rowDeleted.emit(row);
  }

  getBadgeColor(value: unknown): 'success' | 'warning' | 'error' {
    if (value === 'Success' || value === 'Active' || value === true) return 'success';
    if (value === 'Pending') return 'warning';
    return 'error';
  }

  private createEmptyRow(): TableRow {
    return this.columns.reduce((row, column) => {
      row[column.key] = column.options?.[0]?.value ?? '';
      return row;
    }, {} as TableRow);
  }
}
