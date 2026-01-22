// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard], // ✅ UNCOMMENTED - Auth guard is now active
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-home/dashboard-home').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/events/event-list/event-list').then(
                (m) => m.EventListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/events/create-event/create-event').then(
                (m) => m.CreateEventComponent,
              ),
          },
          {
            path: 'view/:id', // ✅ ADDED - View event route
            loadComponent: () =>
              import('./features/events/view-event/view-event').then(
                (m) => m.ViewEventComponent,
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./features/events/edit-event/edit-event').then(
                (m) => m.EditEventComponent,
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
