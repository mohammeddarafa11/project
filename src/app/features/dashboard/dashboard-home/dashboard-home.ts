// src/app/features/dashboard/dashboard-home/dashboard-home.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { EventService } from '@core/services/event.service';
import { OrganizationService } from '@core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';

interface StatCard {
  icon: ZardIcon;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

interface ActionCard {
  icon: ZardIcon;
  title: string;
  description: string;
  buttonText: string;
  route?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-dashboard-home',
  imports: [ZardIconComponent, ZardButtonComponent, ZardCardComponent],
  template: `
    <div class="p-6 space-y-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Welcome to Eventora</h1>
        <p class="text-muted-foreground">
          @if (organizationName()) {
            Managing events for
            <span class="font-semibold">{{ organizationName() }}</span>
          } @else {
            Manage your events and grow your community
          }
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        @for (stat of statsCards(); track stat.label) {
          <div z-card class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
                <h3 class="text-3xl font-bold mt-1">{{ stat.value }}</h3>
              </div>
              <div
                [class]="
                  'w-12 h-12 rounded-full flex items-center justify-center ' +
                  stat.bgColor
                "
              >
                <z-icon
                  [zType]="stat.icon"
                  [class]="'w-6 h-6 ' + stat.iconColor"
                />
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (action of actionCards; track action.title) {
          <div
            z-card
            class="p-6 hover:shadow-lg transition-shadow"
            [class.cursor-pointer]="action.route"
            (click)="action.route ? navigateTo(action.route) : null"
          >
            <div class="flex flex-col items-center text-center space-y-4">
              <div
                class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <z-icon [zType]="action.icon" class="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-2">{{ action.title }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{ action.description }}
                </p>
              </div>
              <button
                z-button
                zType="outline"
                class="w-full"
                [disabled]="action.disabled"
              >
                {{ action.buttonText }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  standalone: true,
})
export class DashboardHomeComponent implements OnInit {
  private router = inject(Router);
  private eventService = inject(EventService);
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);

  organizationName = signal<string>('');
  totalEvents = signal<number>(0);
  upcomingEvents = signal<number>(0);
  pastEvents = signal<number>(0);

  statsCards = signal<StatCard[]>([]);

  actionCards: ActionCard[] = [
    {
      icon: 'plus' as ZardIcon,
      title: 'Create Event',
      description: 'Start creating a new event for your organization',
      buttonText: 'Get Started',
      route: '/events/create',
    },
    {
      icon: 'calendar' as ZardIcon,
      title: 'Manage Events',
      description: 'View and manage all your events',
      buttonText: 'View Events',
      route: '/events',
    },
    {
      icon: 'trending-up' as ZardIcon,
      title: 'Analytics',
      description: 'View insights and event statistics',
      buttonText: 'Coming Soon',
      disabled: true,
    },
  ];

  // In dashboard-home.component.ts
  ngOnInit() {
    const org = this.authService.getOrganization();
    if (org) {
      this.organizationName.set(org.name);
    }
    this.loadEventStats();
  }

  private loadOrganizationInfo() {
    const org = this.organizationService.getCachedOrganization();
    if (org) {
      this.organizationName.set(org.name);
    }
  }

  private loadEventStats() {
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        const now = new Date();
        const total = events.length;
        const upcoming = events.filter(
          (e) => new Date(e.start_time) > now,
        ).length;
        const past = events.filter((e) => new Date(e.start_time) <= now).length;

        this.totalEvents.set(total);
        this.upcomingEvents.set(upcoming);
        this.pastEvents.set(past);

        this.statsCards.set([
          {
            icon: 'calendar' as ZardIcon,
            label: 'Total Events',
            value: total,
            bgColor: 'bg-primary/10',
            iconColor: 'text-primary',
          },
          {
            icon: 'clock' as ZardIcon,
            label: 'Upcoming Events',
            value: upcoming,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
          },
          {
            icon: 'archive' as ZardIcon,
            label: 'Past Events',
            value: past,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
        ]);
      },
      error: (err) => console.error('Failed to load event stats:', err),
    });
  }

  navigateTo(route: string) {
    this.router.navigate(route.split('/')); // Converts to ['events', 'create']
  }
}
