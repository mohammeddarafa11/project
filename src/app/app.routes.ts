// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard }       from './core/guards/auth.guard';
import { guestGuard }      from './core/guards/guest.guard';
import { organizerGuard }  from './core/guards/organizer.guard';
import { userRoleGuard }   from './core/guards/user-role.guard';
import { EventDetail } from './features/event-detail/event-detail';

export const routes: Routes = [
  // ── PUBLIC ────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing').then(m => m.LandingComponent),
    canActivate: [guestGuard],
  },

  // ── ORGANIZER DASHBOARD ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard, organizerGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-home/dashboard-home').then(
            m => m.DashboardHomeComponent,
          ),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/events/events-page/events-page').then(
            m => m.EventsPageComponent,
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets-page/tickets-page').then(
            m => m.TicketsPageComponent,
          ),
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./features/members/memberships-page').then(
            m => m.MembershipsPageComponent,
          ),
      },
    ],
  },

  // ── USER DASHBOARD ────────────────────────────────────────────────────
  {
    path: 'user-dashboard',
    loadComponent: () =>
      import('./features/user-dashboard/user-dashboard').then(
        m => m.UserDashboard,
      ),
    canActivate: [authGuard, userRoleGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/user-dashboard/user-dashboard-home/user-dashboard-home').then(
            m => m.UserDashboardHome,
          ),
      },
      // {
      //   path: 'bookings',
      //   loadComponent: () =>
      //     import('./features/user-dashboard/user-bookings/user-bookings').then(
      //       m => m.UserBookingsComponent,
      //     ),
      // },
      // {
      //   path: 'explore',
      //   loadComponent: () =>
      //     import('./features/events/events-page/events-page').then(
      //       m => m.EventsPageComponent,
      //     ),
      // },
      { path: 'events/:id', component: EventDetail },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/user-dashboard/user-bookings/user-bookings').then(
            m => m.UserBookingsComponent,
          ),
      },
    ],
  },

  // ── FALLBACK ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];