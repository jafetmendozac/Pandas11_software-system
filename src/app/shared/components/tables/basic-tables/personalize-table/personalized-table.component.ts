import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../ui/button/button.component';
import { TableDropdownComponent } from '../../../common/table-dropdown/table-dropdown.component';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { ModalComponent } from '../../../ui/modal/modal.component';

export interface Transaction {
  id?: string;
  image: string;
  action: string;
  date: string;
  amount: string;
  category: string;
  type?: string;
  quantity?: number;
  account?: string;
  method?: string;
  status: "Success" | "Pending" | "Failed";
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
  ],
  templateUrl: './personalized-table.component.html',
  styles: ``
})
export class PersonalizedTable {

  // @Input() title = 'Latest Transactions';
  @Input() allowCreate = true;
  @Input() allowEdit = true;
  @Input() allowDelete = true;
  @Input() itemsPerPageOptions = [5, 10, 15];
  @Input() transactionData: Transaction[] = [
    {
      image: "/images/brand/brand-08.svg", // Path or URL for the image
      action: "Bought PYPL", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-07.svg", // Path or URL for the image
      action: "Bought AAPL", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Pending",
    },
    {
      image: "/images/brand/brand-15.svg", // Path or URL for the image
      action: "Sell KKST", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-02.svg", // Path or URL for the image
      action: "Bought FB", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-10.svg", // Path or URL for the image
      action: "Sell AMZN", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Failed",
    },
    {
      image: "/images/brand/brand-08.svg", // Path or URL for the image
      action: "Bought PYPL", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-07.svg", // Path or URL for the image
      action: "Bought AAPL", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Pending",
    },
    {
      image: "/images/brand/brand-15.svg", // Path or URL for the image
      action: "Sell KKST", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-02.svg", // Path or URL for the image
      action: "Bought FB", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-10.svg", // Path or URL for the image
      action: "Sell AMZN", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Failed",
    },
    {
      image: "/images/brand/brand-08.svg", // Path or URL for the image
      action: "Bought PYPL", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-07.svg", // Path or URL for the image
      action: "Bought AAPL", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Pending",
    },
    {
      image: "/images/brand/brand-15.svg", // Path or URL for the image
      action: "Sell KKST", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-02.svg", // Path or URL for the image
      action: "Bought FB", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Success",
    },
    {
      image: "/images/brand/brand-10.svg", // Path or URL for the image
      action: "Sell AMZN", // Action description
      date: "Nov 23, 01:00 PM", // Date and time of the transaction
      amount: "$2,567.88", // Transaction amount
      category: "Finance", // Category of the transaction
      status: "Failed",
    },
  ]

  @Output() transactionCreated = new EventEmitter<Transaction>();
  @Output() transactionUpdated = new EventEmitter<Transaction>();
  @Output() transactionDeleted = new EventEmitter<Transaction>();

  currentPage = 1;
  itemsPerPage = 5;
  isFormOpen = false;
  editingIndex: number | null = null;
  formData: Transaction = this.createEmptyTransaction();

  get totalPages(): number {
    return Math.ceil(this.transactionData.length / this.itemsPerPage);
  }

  get paginationItems(): PaginationItem[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    if (this.currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', this.totalPages];
    }

    if (this.currentPage >= this.totalPages - 3) {
      return [
        1,
        'ellipsis',
        this.totalPages - 4,
        this.totalPages - 3,
        this.totalPages - 2,
        this.totalPages - 1,
        this.totalPages,
      ];
    }

    return [
      1,
      'ellipsis',
      this.currentPage - 1,
      this.currentPage,
      this.currentPage + 1,
      'ellipsis',
      this.totalPages,
    ];
  }

  get currentItems(): Transaction[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.transactionData.slice(start, start + this.itemsPerPage);
  }

  get firstItemIndex(): number {
    return this.transactionData.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get lastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.transactionData.length);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(select.value);
    this.currentPage = 1;
  }

  openCreateForm() {
    this.editingIndex = null;
    this.formData = this.createEmptyTransaction();
    this.isFormOpen = true;
  }

  openEditForm(item: Transaction) {
    this.editingIndex = this.transactionData.indexOf(item);
    this.formData = { ...item };
    this.isFormOpen = true;
  }

  closeForm() {
    this.isFormOpen = false;
  }

  saveTransaction() {
    const transaction = { ...this.formData };

    if (this.editingIndex === null) {
      this.transactionData = [transaction, ...this.transactionData];
      this.currentPage = 1;
      this.transactionCreated.emit(transaction);
    } else {
      this.transactionData[this.editingIndex] = transaction;
      this.transactionUpdated.emit(transaction);
    }

    this.closeForm();
  }

  handleDelete(item: Transaction) {
    if (!window.confirm(`Delete ${item.action}?`)) {
      return;
    }

    this.transactionData = this.transactionData.filter((transaction) => transaction !== item);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.transactionDeleted.emit(item);
  }

  private createEmptyTransaction(): Transaction {
    return {
      image: '/images/brand/brand-08.svg',
      action: '',
      date: '',
      amount: '',
      category: '',
      type: 'Purchase',
      quantity: 1,
      account: 'Main account',
      method: 'Card',
      status: 'Pending',
    };
  }

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Success') return 'success';
    if (status === 'Pending') return 'warning';
    return 'error';
  }
}
