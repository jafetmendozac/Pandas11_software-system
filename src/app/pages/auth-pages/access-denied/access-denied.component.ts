import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthorizationService } from '../../../shared/services/authorization.service';
import { SupabaseService } from '../../../shared/services/supabase.service';

@Component({
  selector: 'app-access-denied', standalone: true, imports: [RouterLink],
  templateUrl: './access-denied.component.html',
})
export class AccessDeniedComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);

  readonly checking = signal(true);
  readonly canViewProfile = signal(false);
  readonly signingOut = signal(false);
  readonly signOutError = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.canViewProfile.set(await this.authorization.refresh());
    } catch {
      this.canViewProfile.set(false);
    } finally {
      this.checking.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    this.signOutError.set('');
    try {
      await this.supabase.signOut();
      await this.router.navigateByUrl('/signin');
    } catch {
      this.signOutError.set('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    } finally {
      this.signingOut.set(false);
    }
  }
}
