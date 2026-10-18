import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthorizationService } from '../../../services/authorization.service';

@Component({
  selector: 'app-page-breadcrumb',
  imports: [
    RouterModule,
  ],
  templateUrl: './page-breadcrumb.component.html',
  styles: ``
})
export class PageBreadcrumbComponent {
  readonly authorization = inject(AuthorizationService);
  @Input() pageTitle = '';
}
