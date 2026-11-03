import { SupabaseService } from '../../shared/services/supabase.service';
import { ProfileComponent } from './profile.component';

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
