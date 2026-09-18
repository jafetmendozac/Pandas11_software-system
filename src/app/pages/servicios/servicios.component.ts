import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';

@Component({
  selector: 'app-servicios',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    PersonalizedTable,
  ],
  templateUrl: './servicios.component.html',
  styles: ``
})
export class ServiciosComponent {}
