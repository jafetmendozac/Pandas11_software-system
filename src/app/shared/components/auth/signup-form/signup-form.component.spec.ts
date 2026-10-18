import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SignupFormComponent } from './signup-form.component';
import { SupabaseService } from '../../../services/supabase.service';

describe('Registro desde el sitio público', () => {
  let service: { signUpWithEmail: jasmine.Spy; signOut: jasmine.Spy };
  let router: { navigateByUrl: jasmine.Spy; navigate: jasmine.Spy };
  beforeEach(() => {
    service = { signUpWithEmail: jasmine.createSpy(), signOut: jasmine.createSpy().and.resolveTo() };
    TestBed.configureTestingModule({ imports: [SignupFormComponent], providers: [
      provideRouter([]), { provide: SupabaseService, useValue: service },
    ] });
    const actualRouter = TestBed.inject(Router);
    router = { navigateByUrl: spyOn(actualRouter, 'navigateByUrl').and.resolveTo(true), navigate: spyOn(actualRouter, 'navigate').and.resolveTo(true) };
  });
  const component = () => {
    const c = TestBed.createComponent(SignupFormComponent).componentInstance;
    c.fname = 'Demo'; c.lname = 'Cliente'; c.email = 'registro@example.test'; c.password = 'Ficticia-123!';
    return c;
  };
  it('un alta ya confirmada va al perfil protegido, sin enviarla al dashboard', async () => {
    service.signUpWithEmail.and.resolveTo({ session: { user: { email_confirmed_at: '2030-01-01' } } });
    await component().onSignUp();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/mi-perfil');
    expect(service.signOut).not.toHaveBeenCalled();
  });
  it('mantiene el cierre de sesión y confirmación de correo cuando falta confirmar', async () => {
    service.signUpWithEmail.and.resolveTo({ session: null });
    await component().onSignUp();
    expect(service.signOut).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/confirm-email'], { queryParams: { email: 'registro@example.test' } });
  });
});
