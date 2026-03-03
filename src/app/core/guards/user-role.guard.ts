// src/app/core/guards/user-role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const userRoleGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isUser()) return true;

  // Organizer trying to access user dashboard → send to their dashboard
  if (auth.isOrganizer()) {
    router.navigate(['/dashboard']);
    return false;
  }

  router.navigate(['/']);
  return false;
};