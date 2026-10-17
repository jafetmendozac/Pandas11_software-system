import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../shared/services/supabase.service';

@Component({
  selector: 'app-access-denied', standalone: true, imports: [RouterLink],
  template: `<main class="min-h-screen bg-white p-8 text-gray-800 dark:bg-gray-900 dark:text-white/90">
    <h1 class="text-2xl font-semibold">Acceso no autorizado</h1>
    <p class="my-4">Tu cuenta no tiene acceso al panel o no está activa. Contacta al propietario.</p>
    <a routerLink="/mi-perfil" class="text-brand-500">Mi perfil</a>
    <button type="button" (click)="signOut()" class="ms-4 text-brand-500">Cerrar sesión</button>
  </main>`,
})
export class AccessDeniedComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  async signOut(): Promise<void> { await this.supabase.signOut(); await this.router.navigateByUrl('/signin'); }
}
