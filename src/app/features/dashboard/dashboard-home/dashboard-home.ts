// src/app/features/dashboard/dashboard-home/dashboard-home.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { EventService } from '@core/services/event.service';
import { CategoryService } from '@core/services/category';
import { AuthService } from '../../../core/services/auth.service';

interface StatCard {
  icon: ZardIcon;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

interface CategoryStat {
  name: string;
  count: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-dashboard-home',
  imports: [ZardIconComponent, ZardButtonComponent, ZardCardComponent],
  standalone: true,
  template: `
    <div class="p-6 space-y-6">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Welcome to Eventora</h1>
        <p class="text-muted-foreground">
          @if (organizationName()) {
            Managing events for <span class="font-semibold">{{ organizationName() }}</span>
          } @else {
            Manage your events and grow your community
          }
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (stat of statsCards(); track stat.label) {
          <div z-card class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
                <h3 class="text-3xl font-bold mt-1">{{ stat.value }}</h3>
              </div>
              <div [class]="'w-12 h-12 rounded-full flex items-center justify-center ' + stat.bgColor">
                <z-icon [zType]="stat.icon" [class]="'w-6 h-6 ' + stat.iconColor" />
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Category Analysis Chart -->
      <div z-card class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-xl">Category Analysis</h3>
        </div>

        @if (loadingStats()) {
          <div class="flex items-center justify-center py-12">
            <z-icon zType="loader" class="w-8 h-8 animate-spin text-primary" />
          </div>

        } @else if (categoryStats().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <z-icon zType="trending-up" class="w-12 h-12 text-muted-foreground mb-3" />
            <p class="text-muted-foreground">No events yet. Create your first event to see analytics.</p>
            <button z-button zType="default" class="mt-4" (click)="navigateTo('/events')">
              Go to Events
            </button>
          </div>

        } @else {
          <div class="flex flex-col md:flex-row items-center gap-8">

            <!-- Bar list -->
            <div class="flex-1 w-full space-y-5">
              @for (stat of categoryStats(); track stat.name) {
                <div>
                  <div class="flex justify-between items-center text-sm mb-2">
                    <span class="flex items-center gap-2 font-medium">
                      <span class="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        [style.background]="stat.color"></span>
                      {{ stat.name }}
                    </span>
                    <span class="text-muted-foreground font-semibold">{{ stat.percent }}%</span>
                  </div>
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700 ease-out"
                      [style.width.%]="stat.percent"
                      [style.background]="stat.color">
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- SVG Donut -->
            <div class="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none"
                  stroke="currentColor" class="text-muted/30" stroke-width="16" />
                @for (seg of donutSegments(); track seg.name) {
                  <circle cx="50" cy="50" r="38" fill="none"
                    [attr.stroke]="seg.color"
                    stroke-width="16"
                    stroke-linecap="round"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                    class="transition-all duration-700" />
                }
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold">{{ totalEvents() }}</span>
                <span class="text-xs text-muted-foreground mt-1">Total</span>
              </div>
            </div>

          </div>
        }
      </div>

    </div>
  `,
})
export class DashboardHomeComponent implements OnInit {
  private router = inject(Router);
  private eventService = inject(EventService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  organizationName = signal('');
  totalEvents = signal(0);
  loadingStats = signal(true);
  statsCards = signal<StatCard[]>([]);
  categoryStats = signal<CategoryStat[]>([]);

  private readonly CIRCUMFERENCE = 2 * Math.PI * 38; // ≈ 238.76
  readonly COLORS = ['#6366F1','#A78BFA','#F472B6','#34D399','#60A5FA','#FBBF24','#F87171','#4ADE80'];

  donutSegments = computed(() => {
    let cumulative = 0;
    return this.categoryStats().map((stat) => {
      const dash = (stat.percent / 100) * this.CIRCUMFERENCE;
      const seg = {
        name: stat.name,
        color: stat.color,
        dash: `${dash.toFixed(2)} ${(this.CIRCUMFERENCE - dash).toFixed(2)}`,
        offset: -cumulative,
      };
      cumulative += dash;
      return seg;
    });
  });

  ngOnInit() {
    const org = this.authService.getOrganization();
    if (org) this.organizationName.set(org.name);
    this.loadStats();
  }

  private loadStats() {
    this.loadingStats.set(true);

    // ✅ Fetch events AND categories in parallel so we can map categoryId → name
    //    even when the API returns category: null on events
    forkJoin({
      events: this.eventService.getAllEvents(),
      categories: this.categoryService.getAllCategories(),
    }).subscribe({
      next: ({ events, categories }) => {
        const now = new Date();
        const total = events.length;
        const upcoming = events.filter((e) => new Date(e.start_time) > now).length;
        const past = events.filter((e) => new Date(e.start_time) <= now).length;

        this.totalEvents.set(total);
        this.statsCards.set([
          { icon: 'calendar' as ZardIcon, label: 'Total Events',    value: total,    bgColor: 'bg-primary/10', iconColor: 'text-primary' },
          { icon: 'clock'    as ZardIcon, label: 'Upcoming Events', value: upcoming, bgColor: 'bg-green-100',  iconColor: 'text-green-600' },
          { icon: 'archive'  as ZardIcon, label: 'Past Events',     value: past,     bgColor: 'bg-blue-100',   iconColor: 'text-blue-600' },
        ]);

        // ✅ Build a lookup map: categoryId → name
        const catMap = new Map<number, string>(categories.map((c) => [c.id, c.name]));

        // ✅ Resolve category name: prefer event.category.name, fall back to catMap lookup
        const grouped = events.reduce((acc, e) => {
          const name =
            (e as any).category?.name ||          // populated relation
            catMap.get(e.categoryId) ||            // lookup by id
            'Uncategorized';
          acc[name] = (acc[name] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const stats: CategoryStat[] = Object.entries(grouped)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count], i) => ({
            name,
            count,
            percent: total > 0 ? Math.round((count / total) * 100) : 0,
            color: this.COLORS[i % this.COLORS.length],
          }));

        this.categoryStats.set(stats);
        this.loadingStats.set(false);
      },
      error: () => { this.loadingStats.set(false); },
    });
  }

  navigateTo(route: string) { this.router.navigate([route]); }
}