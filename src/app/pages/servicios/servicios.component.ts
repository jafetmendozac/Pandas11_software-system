import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BasicTableThreeComponent } from '../../shared/components/tables/basic-tables/basic-table-three/basic-table-three.component';

@Component({
  selector: 'app-servicios',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    BasicTableThreeComponent,
  ],
  templateUrl: './servicios.component.html',
  styles: ``
})
export class ServiciosComponent {}
