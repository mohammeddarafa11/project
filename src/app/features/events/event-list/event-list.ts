// src/app/features/events/event-list/event-list.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '@core/services/event.service';
import { Event as EventModel } from '@core/models/event.model';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { DatePipe, CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-event-list',
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    DatePipe,
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold mb-2">Events</h1>
          <p class="text-muted-foreground">Manage all your events</p>
        </div>
        <button z-button zType="default" (click)="createEvent()">
          <z-icon [zType]="icons.plus" class="mr-2 w-4 h-4" />
          Create Event
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <z-icon
            [zType]="icons.loader"
            class="w-8 h-8 animate-spin mx-auto text-primary"
          />
          <p class="text-muted-foreground mt-2">Loading events...</p>
        </div>
      } @else if (events().length === 0) {
        <div class="text-center py-12 bg-card rounded-lg border">
          <z-icon
            [zType]="icons.calendar"
            class="w-16 h-16 text-muted-foreground mx-auto mb-4"
          />
          <h3 class="text-xl font-semibold mb-2">No events found</h3>
          <p class="text-muted-foreground mb-6">
            Get started by creating your first event
          </p>
          <button z-button zType="default" (click)="createEvent()">
            <z-icon [zType]="icons.plus" class="mr-2 w-4 h-4" />
            Create Your First Event
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (event of events(); track event.id) {
            <div
              z-card
              class="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              (click)="viewEvent(event.id)"
            >
              @if (event.event_img_url) {
                <img
                  [src]="event.event_img_url"
                  [alt]="event.title"
                  class="w-full h-48 object-cover"
                  (error)="onImageError($event)"
                />
              } @else {
                <div
                  class="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                >
                  <z-icon
                    [zType]="icons.calendar"
                    class="w-16 h-16 text-primary/40"
                  />
                </div>
              }
              <div class="p-4 space-y-3">
                <h3 class="font-semibold text-lg line-clamp-1">
                  {{ event.title }}
                </h3>
                <div class="space-y-1">
                  <div
                    class="flex items-center gap-1 text-sm text-muted-foreground"
                  >
                    <z-icon [zType]="icons.calendar" class="w-4 h-4" />
                    {{ event.start_time | date: 'short' }}
                  </div>
                  <div
                    class="flex items-center gap-1 text-sm text-muted-foreground"
                  >
                    <z-icon [zType]="icons.mapPin" class="w-4 h-4" />
                    {{
                      event.event_type === 0
                        ? event.city + ', ' + event.region
                        : 'Online Event'
                    }}
                  </div>
                </div>
                <p class="text-sm text-muted-foreground line-clamp-3">
                  {{ event.description }}
                </p>
                <div class="flex gap-2 pt-2" (click)="$event.stopPropagation()">
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    class="flex-1"
                    (click)="viewEvent(event.id)"
                  >
                    <z-icon [zType]="icons.eye" class="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="editEvent(event.id)"
                  >
                    <z-icon [zType]="icons.pencil" class="w-4 h-4" />
                  </button>
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="deleteEvent(event.id, event.title)"
                  >
                    <z-icon
                      [zType]="icons.trash"
                      class="w-4 h-4 text-destructive"
                    />
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  standalone: true,
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  private router = inject(Router);

  events = signal<EventModel[]>([]);
  loading = signal(false);

  readonly icons = {
    plus: 'plus' as ZardIcon,
    loader: 'loader' as ZardIcon,
    calendar: 'calendar' as ZardIcon,
    mapPin: 'map-pin' as ZardIcon,
    eye: 'eye' as ZardIcon,
    pencil: 'pencil' as ZardIcon,
    trash: 'trash' as ZardIcon,
  };

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.loading.set(false);
        // Error handled by interceptor
      },
    });
  }

  createEvent() {
    this.router.navigate(['/events/create']);
  }

  viewEvent(id: number) {
    this.router.navigate(['/events/view', id]); // ✅ FIXED - Navigate to view route
  }

  editEvent(id: number) {
    this.router.navigate(['/events/edit', id]);
  }

  deleteEvent(id: number, title: string) {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.events.update((events) => events.filter((e) => e.id !== id));
          toast.success('Event deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          // Error handled by interceptor
        },
      });
    }
  }

  onImageError(event: any) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
