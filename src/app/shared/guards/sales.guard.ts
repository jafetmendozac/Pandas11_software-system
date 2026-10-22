import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';
import { SalesService } from '../services/sales.service';
export const salesGuard: CanActivateFn = async () => {
 const auth = inject(AuthorizationService);
 const sales = inject(SalesService); const router = inject(Router);
 try { if (!await auth.refresh()) return router.createUrlTree(['/access-denied']); await sales.search('', 1, 1); return true; }
 catch { return router.createUrlTree(['/access-denied']); }
};
