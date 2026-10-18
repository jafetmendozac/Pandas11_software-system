import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { SigninFormComponent } from './signin-form.component';
import { AuthorizationService } from '../../../services/authorization.service';
import { SupabaseService } from '../../../services/supabase.service';

describe('Destino después de iniciar sesión desde la portada', () => {
  let authorization: { refresh: jasmine.Spy; has: jasmine.Spy };
  let router: { navigateByUrl: jasmine.Spy };
  let signIn: jasmine.Spy;
  let redirect: string | null;

  beforeEach(() => {
    redirect = null;
    authorization = { refresh: jasmine.createSpy().and.resolveTo(true), has: jasmine.createSpy().and.returnValue(true) };
    router = { navigateByUrl: jasmine.createSpy().and.resolveTo(true) };
    signIn = jasmine.createSpy().and.resolveTo({});
    TestBed.configureTestingModule({ imports: [SigninFormComponent], providers: [
      { provide: AuthorizationService, useValue: authorization },
      { provide: SupabaseService, useValue: { signInWithEmail: signIn } },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => redirect } } } },
    ] });
  });
  const component = () => {
    const instance = TestBed.createComponent(SigninFormComponent).componentInstance;
    instance.email = 'persona@example.test'; instance.password = 'Ficticia-123!';
    return instance;
  };

  it('personal autorizado llega a panel después de revalidar permisos', async () => {
    await component().onSignIn();
    expect(authorization.refresh).toHaveBeenCalled();
    expect(authorization.has).toHaveBeenCalledWith('panel.access');
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/panel');
  });
  it('CLIENT llega a su perfil', async () => {
    authorization.has.and.returnValue(false);
    await component().onSignIn();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/mi-perfil');
  });
  it('conserva un redirect interno para que su guard determine el acceso', async () => {
    redirect = '/calendario?fecha=2030-07-29';
    await component().onSignIn();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(redirect);
  });
  it('descarta redirects externos, de autoridad y con barras invertidas', async () => {
    for (const target of ['https://example.test', '//example.test', '/\\example.test']) {
      redirect = target; await component().onSignIn();
    }
    expect(router.navigateByUrl.calls.allArgs()).toEqual([['/panel'], ['/panel'], ['/panel']]);
  });
  it('si falla la identidad activa no navega aunque Auth acepte la contraseña', async () => {
    authorization.refresh.and.resolveTo(false);
    const c = component(); await c.onSignIn();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(c.errorMessage).toContain('No se pudo habilitar el acceso');
    expect(c.isLoading).toBeFalse();
  });
  it('no inicia consulta de permisos ni navega cuando Auth rechaza el login', async () => {
    signIn.and.rejectWith(new Error('Credenciales inválidas'));
    const c = component(); await c.onSignIn();
    expect(authorization.refresh).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(c.errorMessage).toBe('Credenciales inválidas');
  });
});
