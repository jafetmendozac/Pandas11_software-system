import { Component, HostListener, Input, inject, signal } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';
import { CustomSelectComponent } from '../../components/form/custom-select/custom-select.component';
import { AuthorizationService } from '../../services/authorization.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    UserDropdownComponent,
    CustomSelectComponent,
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  private readonly router = inject(Router);
  @Input() homePath = '/panel';
  @Input() profileLink = '/profile';
  isApplicationMenuOpen = false;
  readonly isMobileOpen$;

  readonly isDesktop = signal(window.innerWidth >= 1280);

  constructor(public sidebarService: SidebarService, public authorization: AuthorizationService) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  toggleApplicationMenu() {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  selectRole(roleId: string): void {
    this.authorization.selectRole(roleId);
    const role = this.authorization.roles().find(item => item.role_id === roleId);
    if (role) void this.router.navigateByUrl(role.code === 'CLIENT' ? '/mi-perfil' : '/panel');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.sidebarService.setMobileOpen(false);
    this.isApplicationMenuOpen = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    const isDesktop = window.innerWidth >= 1280;
    this.isDesktop.set(isDesktop);
    if (isDesktop) {
      this.sidebarService.setMobileOpen(false);
      this.isApplicationMenuOpen = false;
    }
  }
}
