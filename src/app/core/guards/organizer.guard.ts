// src/app/core/guards/organizer.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const organizerGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isOrganizer()) return true;

  // User is logged in but not an organizer → send to their dashboard
  if (auth.isAuthenticated()) {
    router.navigate(['/user-dashboard']);
    return false;
  }

  router.navigate(['/']);
  return false;
};