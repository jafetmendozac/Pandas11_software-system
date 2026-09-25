import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  type?: 'text' | 'number' | 'date';
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

  @Output() rowCreated = new EventEmitter<TableRow>();
  @Output() rowUpdated = new EventEmitter<TableRow>();
  @Output() rowDeleted = new EventEmitter<TableRow>();

  currentPage = 1;
  itemsPerPage = 5;
  isFormOpen = false;
  editingIndex: number | null = null;
  formData: TableRow = {};

  get totalPages(): number {
    return Math.ceil(this.tableData.length / this.itemsPerPage);
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
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tableData.slice(start, start + this.itemsPerPage);
  }

  get firstItemIndex(): number {
    return this.tableData.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get lastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.tableData.length);
  }

  get editableColumns(): TableColumn[] {
    return this.columns.filter((column) => column.editable !== false);
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onItemsPerPageChange(value: string | number | null): void {
    if (value !== null) {
      this.itemsPerPage = Number(value);
      this.currentPage = 1;
    }
  }

  openCreateForm(): void {
    this.editingIndex = null;
    this.formData = this.createEmptyRow();
    this.isFormOpen = true;
  }

  openEditForm(row: TableRow): void {
    this.editingIndex = this.tableData.indexOf(row);
    this.formData = { ...row };
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  saveRow(): void {
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

  handleDelete(row: TableRow): void {
    const firstColumn = this.columns[0]?.key;
    const label = firstColumn ? this.getCellValue(row, firstColumn) : 'this row';
    if (!window.confirm(`¿Eliminar ${label}?`)) return;
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
