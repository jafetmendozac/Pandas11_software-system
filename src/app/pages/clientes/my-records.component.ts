import { Component } from '@angular/core';
import { ClientesTableComponent } from './clientes-table.component';
@Component({ selector: 'app-my-records', standalone: true, imports: [ClientesTableComponent],
    template: `<main class="min-h-screen bg-gray-50 p-5 dark:bg-gray-950"><app-clientes-table [selfService]="true" /></main>` })
export class MyRecordsComponent {
}
