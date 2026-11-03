import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterModule } from '@angular/router';
import { AppHeaderComponent } from './app-header.component';
import { AuthorizationService } from '../../services/authorization.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({ selector: 'app-theme-toggle-button', standalone: true, template: '' })
class ThemeStub {}
@Component({ selector: 'app-route-stub', standalone: true, template: '' })
class RouteStub {}
@Component({ selector: 'app-user-dropdown', standalone: true, template: '' })
class UserStub { @Input() profileLink = ''; }
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
      providers: [provideRouter([
        { path: 'mi-perfil', component: RouteStub },
        { path: 'panel', component: RouteStub },
      ]), SidebarService, {
        provide: AuthorizationService,
        useValue: {
          roles: signal([{ role_id: 'owner', code: 'OWNER' }, { role_id: 'staff', code: 'STAFF' }, { role_id: 'client', code: 'CLIENT' }]),
          roleOptions: signal([{ value: 'owner', label: 'Propietario' }, { value: 'staff', label: 'Personal' }, { value: 'client', label: 'Cliente' }]),
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
  it('usa las rutas de cliente en logo y menú de cuenta cuando el layout las indica', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.componentInstance.homePath = '/mi-perfil';
    fixture.componentInstance.profileLink = '/mi-perfil';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('header a[href="/mi-perfil"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-user-dropdown')).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(UserStub)).componentInstance.profileLink).toBe('/mi-perfil');
    fixture.componentInstance.sidebarService.setMobileOpen(true);
    fixture.componentInstance.onEscape();
    expect(fixture.componentInstance.isApplicationMenuOpen).toBeFalse();
  });

  it('lleva al portal cliente al seleccionar CLIENT', async () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    const authorization = TestBed.inject(AuthorizationService);
    fixture.componentInstance.selectRole('client');
    await fixture.whenStable();
    expect(authorization.selectRole as jasmine.Spy).toHaveBeenCalledWith('client');
    expect(TestBed.inject(Router).url).toBe('/mi-perfil');
  });

  it('devuelve al panel interno al seleccionar un rol de personal', async () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    await TestBed.inject(Router).navigateByUrl('/mi-perfil');
    fixture.componentInstance.selectRole('staff');
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/panel');
  });
});
