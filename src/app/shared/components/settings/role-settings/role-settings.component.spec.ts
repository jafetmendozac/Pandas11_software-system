import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../../services/authorization.service';
import { RolesService } from '../../../services/roles.service';
import { RoleSettingsComponent } from './role-settings.component';

describe('Selectores y permisos de roles', () => {
  it('presenta permisos en español y selectores personalizados en ambas vistas', async () => {
    TestBed.configureTestingModule({ providers: [
      { provide: AuthorizationService, useValue: { refresh: async () => true, has: () => true } },
      { provide: RolesService, useValue: {
        load: async () => ({
          roles: [
            { id: 'rol-1', code: 'OWNER', name: 'Propietario', description: null, active: true, is_system: true },
            { id: 'rol-2', code: 'ADMIN', name: 'Administrador', description: null, active: true, is_system: true },
          ],
          permissions: [{ id: 'permiso-1', code: 'payments.verify', description: 'Verificar pagos (OWNER)' }],
          assignments: [{ role_id: 'rol-1', permission_id: 'permiso-1' }],
        }),
        users: async () => [{ id: 'usuario-1', first_name: 'Ana', last_name: 'Valdez', active: true }],
        userAssignments: async () => [],
      } },
    ] });
    const fixture = TestBed.createComponent(RoleSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    Array.from(root.querySelectorAll<HTMLButtonElement>('nav button')).find(button => button.textContent?.includes('Asignar permisos'))!.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('app-custom-select').length).toBe(1);
    expect(root.querySelector('select')).toBeNull();
    expect(root.textContent).toContain('Verificar pagos (Propietario)');
    expect(root.textContent).not.toContain('payments.verify');

    Array.from(root.querySelectorAll<HTMLButtonElement>('nav button')).find(button => button.textContent?.includes('Usuarios y roles'))!.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('app-custom-select').length).toBe(2);
    expect(root.querySelector('select')).toBeNull();

    const selectors = root.querySelectorAll<HTMLElement>('app-custom-select');
    selectors[0].querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    Array.from(selectors[0].querySelectorAll<HTMLButtonElement>('[role="option"]')).find(option => option.textContent?.includes('Ana Valdez'))!.click();
    selectors[1].querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    const roleOptions = Array.from(selectors[1].querySelectorAll<HTMLButtonElement>('[role="option"]'));
    expect(roleOptions.some(option => option.textContent?.includes('Propietario'))).toBeFalse();
    roleOptions.find(option => option.textContent?.includes('Administrador'))!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedUser).toBe('usuario-1');
    expect(fixture.componentInstance.selectedRoleId).toBe('rol-2');
    expect(Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.trim() === 'Asignar rol')?.disabled).toBeFalse();
  });
});
