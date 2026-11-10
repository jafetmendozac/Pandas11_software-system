import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const active = authorization.isSessionValidated() || await authorization.refresh();
  return active && authorization.has('panel.access') && (!_route.data?.['permission'] || authorization.has(_route.data?.['permission']))
    ? true
    : router.createUrlTree(['/access-denied'], { queryParams: { redirect: state.url } });
};

export const profileGuard: CanActivateFn = async () => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  return (authorization.isSessionValidated() || await authorization.refresh()) ? true : router.createUrlTree(['/signin']);
};

export const guestGuard: CanActivateFn = async (route) => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const active = authorization.isSessionValidated() || await authorization.refresh();

  if (!active) return true;

  const requested = route.queryParamMap.get('redirect');
  const internalRedirect = requested?.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')
    ? requested : null;
  const redirect = internalRedirect || (authorization.has('panel.access') ? '/panel' : '/mi-perfil');
  return router.createUrlTree([redirect]);
};

// La vista de rol limita la navegación visible; el permiso real sigue validándose en authGuard y RLS.
export const selectedRoleGuard: CanActivateFn = (route, state) => {
  const authorization = inject(AuthorizationService);
  const router = inject(Router);
  const permission = route.data?.['permission'] as string | undefined;
  return permission && authorization.has(permission) && authorization.hasInSelectedRole(permission)
    ? true
    : router.createUrlTree(['/access-denied'], { queryParams: { redirect: state.url } });
};
