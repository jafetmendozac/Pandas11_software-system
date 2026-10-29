import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { ThemeService } from '../../shared/services/theme.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { RoleSettingsComponent } from '../../shared/components/settings/role-settings/role-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, PageBreadcrumbComponent, ComponentCardComponent, RoleSettingsComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnDestroy {
  readonly authorization = inject(AuthorizationService);
  private readonly themeService = inject(ThemeService);
  theme: 'light' | 'dark' = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  section: 'home' | 'appearance' | 'roles' = 'home';
  message = '';
  error = false;

  openAppearance(): void {
    this.theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    this.message = '';
    this.error = false;
    this.section = 'appearance';
  }

  previewTheme(theme: 'light' | 'dark'): void {
    this.themeService.previewTheme(theme);
    this.message = '';
  }

  save(): void {
    try {
      this.themeService.setTheme(this.theme);
      this.error = false;
      this.message = 'Tus preferencias se han guardado en este navegador.';
    } catch {
      this.error = true;
      this.message = 'No se pudieron guardar tus preferencias. Revisa la configuración de almacenamiento del navegador e inténtalo de nuevo.';
    }
  }

  cancel(): void {
    this.theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    this.themeService.previewTheme(this.theme);
    this.message = '';
  }

  ngOnDestroy(): void {
    if (this.section === 'appearance') this.cancel();
  }
}
