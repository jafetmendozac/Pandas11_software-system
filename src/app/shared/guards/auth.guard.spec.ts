import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/configuracion' } as RouterStateSnapshot;
  const denied = { denied: true };
  let authorization: { refresh: jasmine.Spy; has: jasmine.Spy };

  beforeEach(() => {
    authorization = { refresh: jasmine.createSpy().and.resolveTo(true), has: jasmine.createSpy().and.returnValue(true) };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthorizationService, useValue: authorization },
      { provide: Router, useValue: { createUrlTree: () => denied } },
    ] });
  });

  it('permite un perfil activo con panel.access', async () => {
    expect(await TestBed.runInInjectionContext(() => authGuard(route, state))).toBeTrue();
    expect(authorization.has).toHaveBeenCalledWith('panel.access');
  });
  it('deniega cuando falla la comprobación de identidad', async () => {
    authorization.refresh.and.resolveTo(false);
    expect(await TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(denied as never);
  });
  it('deniega al cliente sin panel.access', async () => {
    authorization.has.and.returnValue(false);
    expect(await TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(denied as never);
  });
  it('exige employees.read para entrar a empleados', async () => {
    authorization.has.and.callFake((permission: string) => permission === 'panel.access');
    const protectedRoute = { data: { permission: 'employees.read' } } as unknown as ActivatedRouteSnapshot;
    expect(await TestBed.runInInjectionContext(() => authGuard(protectedRoute, state))).toBe(denied as never);
  });
  it('exige appointments.read para entrar en agenda', async () => {
    authorization.has.and.callFake((permission: string) => permission === 'panel.access');
    const protectedRoute = { data: { permission: 'appointments.read' } } as unknown as ActivatedRouteSnapshot;
    expect(await TestBed.runInInjectionContext(() => authGuard(protectedRoute, state))).toBe(denied as never);
  });
  it('panel.access no sustituye el permiso de clientes de la ruta', async () => {
    authorization.has.and.callFake((permission: string) => permission === 'panel.access');
    const protectedRoute = { data: { permission: 'clients.read' } } as unknown as ActivatedRouteSnapshot;
    expect(await TestBed.runInInjectionContext(() => authGuard(protectedRoute, state))).toBe(denied as never);
  });

  it('panel.access no permite leer pagos sin payments.read', async () => {
    authorization.has.and.callFake((permission: string) => permission === 'panel.access');
    const protectedRoute = { data: { permission: 'payments.read' } } as unknown as ActivatedRouteSnapshot;
    expect(await TestBed.runInInjectionContext(() => authGuard(protectedRoute, state))).toBe(denied as never);
  });

});
