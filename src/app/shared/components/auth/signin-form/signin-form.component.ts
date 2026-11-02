
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthorizationService } from '../../../services/authorization.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authorization: AuthorizationService,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSignIn() {
    if (!this.email || !this.password || this.isLoading()) {
      this.errorMessage.set('Ingresa tu correo y contraseña.');
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      await this.supabase.signInWithEmail(this.email, this.password);
      if (!await this.authorization.refresh()) {
        throw new Error('No se pudo habilitar el acceso a tu cuenta. Comprueba su estado o vuelve a intentarlo.');
      }
      const requested = this.route.snapshot.queryParamMap.get('redirect');
      const internalRedirect = requested?.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')
        ? requested : null;
      const redirect = internalRedirect || (this.authorization.has('panel.access') ? '/panel' : '/mi-perfil');
      await this.router.navigateByUrl(redirect);
    } catch (error) {
      this.errorMessage.set(error instanceof Error && 'code' in error && error.code === 'invalid_credentials'
        ? 'Correo electrónico o contraseña incorrectos.'
        : error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
