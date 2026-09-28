import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  const session = await supabase.getSession();
  const isConfirmed = Boolean(session?.user.email_confirmed_at);

  return session && isConfirmed
    ? true
    : router.createUrlTree(['/signin'], {
        queryParams: { redirect: state.url },
      });
};