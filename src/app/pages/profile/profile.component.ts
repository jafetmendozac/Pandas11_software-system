import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
// import { UserAddressCardComponent } from '../../shared/components/user-profile/user-address-card/user-address-card.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { A11yModule } from '@angular/cdk/a11y';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    // UserAddressCardComponent,
    FormsModule, RouterLink, A11yModule, ModalComponent,
  ],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {
  @ViewChild('passwordButton') private passwordButton?: ElementRef<HTMLButtonElement>;
  readonly passwordOpen = signal(false);
  readonly passwordBusy = signal(false);
  readonly passwordError = signal('');
  readonly passwordNotice = signal('');
  newPassword = '';
  confirmPassword = '';

  constructor(
    private readonly supabase: SupabaseService,
  ) {}

  openPassword(): void {
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError.set('');
    this.passwordNotice.set('');
    this.passwordOpen.set(true);
  }

  closePassword(): void {
    if (this.passwordBusy()) return;
    this.passwordOpen.set(false);
    queueMicrotask(() => this.passwordButton?.nativeElement.focus());
  }

  async changePassword(): Promise<void> {
    if (this.passwordBusy()) return;
    this.passwordError.set('');
    if (this.newPassword.length < 8) {
      this.passwordError.set('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('Las contraseñas no coinciden.');
      return;
    }
    this.passwordBusy.set(true);
    try {
      await this.supabase.updatePassword(this.newPassword);
      this.passwordNotice.set('Tu contraseña se actualizó correctamente.');
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordBusy.set(false);
      this.closePassword();
    } catch (error) {
      this.passwordError.set((error as { message?: string })?.message || 'No se pudo actualizar la contraseña. Inténtalo de nuevo.');
    } finally {
      this.passwordBusy.set(false);
    }
  }
}
