
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';


@Component({
  selector: 'app-signup-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  showPassword = false;
  isChecked = false;

  fname = '';
  lname = '';
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSignUp() {
    if (!this.email || !this.password || !this.fname || !this.lname || this.isLoading) {
      this.errorMessage = 'Completa todos los campos requeridos.';
      this.successMessage = '';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      this.successMessage = '';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    try {
      const data = await this.supabase.signUpWithEmail(this.email, this.password, {
        first_name: this.fname,
        last_name: this.lname,
      });

      if (data.session?.user.email_confirmed_at) {
        await this.router.navigateByUrl('/');
      } else {
        await this.supabase.signOut();
        await this.router.navigate(['/confirm-email'], {
          queryParams: { email: this.email },
        });
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo crear la cuenta.';
    } finally {
      this.isLoading = false;
    }
  }
}
