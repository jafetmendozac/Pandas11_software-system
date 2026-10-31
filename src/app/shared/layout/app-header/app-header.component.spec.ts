import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { AppHeaderComponent } from './app-header.component';
import { AuthorizationService } from '../../services/authorization.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({ selector: 'app-theme-toggle-button', standalone: true, template: '' })
class ThemeStub {}
@Component({ selector: 'app-user-dropdown', standalone: true, template: '' })
class UserStub {}
@Component({ selector: 'app-custom-select', standalone: true, template: '' })
class SelectStub {
  @Input() options: { value: string; label: string }[] = [];
  @Input() value: string | null = null;
  @Input() ariaLabel = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
}

describe('Encabezado operativo', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [provideRouter([]), SidebarService, {
        provide: AuthorizationService,
        useValue: {
          roles: signal([{ role_id: 'owner' }, { role_id: 'staff' }]),
          roleOptions: signal([{ value: 'owner', label: 'Propietario' }, { value: 'staff', label: 'Personal' }]),
          selectedRoleId: signal('owner'),
          selectRole: jasmine.createSpy('selectRole'),
        },
      }],
    });
    TestBed.overrideComponent(AppHeaderComponent, {
      set: { imports: [CommonModule, RouterModule, ThemeStub, UserStub, SelectStub] },
    });
  });

  it('abre el menú móvil y ofrece cambio de rol sin búsqueda ficticia', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.componentInstance.isDesktop.set(false);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const options = root.querySelector<HTMLButtonElement>('button[aria-controls="application-menu"]')!;
    expect(options.getAttribute('aria-expanded')).toBe('false');
    options.click(); fixture.detectChanges();
    expect(options.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#application-menu app-custom-select')).not.toBeNull();
    expect(root.querySelector('input[placeholder="Search or type command..."]')).toBeNull();
  });
});
