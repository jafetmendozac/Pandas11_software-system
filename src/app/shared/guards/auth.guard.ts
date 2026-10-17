import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const active = await authorization.refresh();
  return active && authorization.has('panel.access')
    ? true
    : router.createUrlTree(['/access-denied'], { queryParams: { redirect: state.url } });
};

export const profileGuard: CanActivateFn = async () => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  return await authorization.refresh() ? true : router.createUrlTree(['/signin']);
};
