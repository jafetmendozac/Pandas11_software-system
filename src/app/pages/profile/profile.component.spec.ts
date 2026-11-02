import { SupabaseService } from '../../shared/services/supabase.service';
import { ProfileComponent } from './profile.component';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfilesService } from '../../shared/services/profiles.service';
import { AuthorizationService } from '../../shared/services/authorization.service';

describe('Cambio de contraseña del perfil', () => {
  it('actualiza la contraseña autenticada sin cerrar sesión', async () => {
    const supabase = {
      updatePassword: jasmine.createSpy().and.resolveTo(),
      signOut: jasmine.createSpy(),
    } as unknown as SupabaseService;
    const component = new ProfileComponent(supabase);
    component.openPassword();
    component.newPassword = 'NuevaClaveSegura8';
    component.confirmPassword = 'NuevaClaveSegura8';

    await component.changePassword();

    expect(supabase.updatePassword).toHaveBeenCalledWith('NuevaClaveSegura8');
    expect(supabase.signOut).not.toHaveBeenCalled();
    expect(component.passwordOpen()).toBeFalse();
    expect(component.passwordNotice()).toContain('correctamente');
    expect(component.newPassword).toBe('');
  });

  it('mantiene el formulario abierto y conserva lo escrito si Auth devuelve error', async () => {
    const supabase = { updatePassword: jasmine.createSpy().and.rejectWith(new Error('Auth no disponible')) } as unknown as SupabaseService;
    const component = new ProfileComponent(supabase);
    component.openPassword();
    component.newPassword = component.confirmPassword = 'NuevaClaveSegura8';

    await component.changePassword();

    expect(component.passwordOpen()).toBeTrue();
    expect(component.passwordError()).toContain('Auth no disponible');
    expect(component.newPassword).toBe('NuevaClaveSegura8');
  });

  it('rechaza la confirmación diferente antes de llamar a Auth', async () => {
    const supabase = { updatePassword: jasmine.createSpy() } as unknown as SupabaseService;
    const component = new ProfileComponent(supabase);
    component.newPassword = 'NuevaClaveSegura8';
    component.confirmPassword = 'OtraClaveSegura9';

    await component.changePassword();

    expect(supabase.updatePassword).not.toHaveBeenCalled();
    expect(component.passwordError()).toContain('no coinciden');
  });
});

describe('Accesos de consulta desde Perfil', () => {
  it('presenta enlaces directos arriba para una cuenta con panel', async () => {
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseService, useValue: { updatePassword: () => Promise.resolve() } },
        { provide: AuthorizationService, useValue: { has: () => true } },
        { provide: ProfilesService, useValue: { getCurrent: () => Promise.resolve({
          email: 'owner@example.test', profile: { first_name: 'Ana', last_name: 'Valdez', active: true },
          metadata: {}, providerLabel: 'Correo y contraseña',
        }) } },
      ],
    });
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const nav = fixture.nativeElement.querySelector('nav[aria-label="Consultas de mi cuenta"]') as HTMLElement;
    expect(nav).not.toBeNull();
    expect(Array.from(nav.querySelectorAll('a')).map(link => link.getAttribute('href')))
      .toEqual(['/mis-datos', '/catalogo']);
    expect(nav.compareDocumentPosition(fixture.nativeElement.querySelector('app-user-meta-card')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
