import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, AppSidebarComponent, BackdropComponent],
  templateUrl: './client-layout.component.html',
})
export class ClientLayoutComponent {
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;

  constructor(readonly sidebarService: SidebarService) {
    this.isExpanded$ = sidebarService.isExpanded$;
    this.isHovered$ = sidebarService.isHovered$;
    this.isMobileOpen$ = sidebarService.isMobileOpen$;
  }
}
