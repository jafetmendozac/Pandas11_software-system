import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { ThemeService } from '../../shared/services/theme.service';
import { RoleSettingsComponent } from '../../shared/components/settings/role-settings/role-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, PageBreadcrumbComponent, ComponentCardComponent, RoleSettingsComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly themeService = inject(ThemeService);
  theme: 'light' | 'dark' = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  direction: 'ltr' | 'rtl' = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
  section: 'home' | 'appearance' | 'roles' = 'home';
  message = '';
  error = false;

  save(): void {
    try {
      this.themeService.setTheme(this.theme);
      localStorage.setItem('dir', this.direction);
      document.documentElement.setAttribute('dir', this.direction);
      this.error = false;
      this.message = 'Your preferences have been saved on this browser.';
    } catch {
      this.error = true;
      this.message = 'Unable to save your preferences. Check your browser storage settings and try again.';
    }
  }

  cancel(): void {
    this.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    this.direction = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
    this.message = '';
  }
}
