// src/app/features/events/view-event/view-event.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '@core/services/event.service';
import { Event } from '@core/models/event.model';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-view-event',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardDividerComponent,
  ],
  template: `
    <div class="p-6 max-w-5xl mx-auto">
      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <z-icon
            [zType]="icons.loader"
            class="animate-spin text-primary w-8 h-8"
          ></z-icon>
          <p class="text-muted-foreground ml-3">Loading event...</p>
        </div>
      } @else if (event()) {
        <!-- Back Button -->
        <div class="mb-6">
          <button z-button zType="ghost" zSize="sm" (click)="goBack()">
            <z-icon [zType]="icons.arrowLeft" class="w-4 h-4 mr-2"></z-icon>
            Back to Events
          </button>
        </div>

        <div z-card class="overflow-hidden">
          <!-- Event Image -->
          @if (event()?.event_img_url) {
            <div class="relative h-80 w-full overflow-hidden">
              <img
                [src]="event()!.event_img_url"
                [alt]="event()!.title"
                class="w-full h-full object-cover"
                (error)="onImageError($event)"
              />
            </div>
          } @else {
            <div
              class="w-full h-80 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
            >
              <z-icon
                [zType]="icons.calendar"
                class="w-24 h-24 text-primary/30"
              ></z-icon>
            </div>
          }

          <!-- Event Details -->
          <div class="p-8 space-y-6">
            <div>
              <h1 class="text-4xl font-bold mb-3">{{ event()?.title }}</h1>
              <p class="text-lg text-muted-foreground leading-relaxed">
                {{ event()?.description }}
              </p>
            </div>

            <z-divider></z-divider>

            <!-- Event Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Date & Time -->
              <div class="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div
                  class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                >
                  <z-icon
                    [zType]="icons.calendar"
                    class="text-primary w-6 h-6"
                  ></z-icon>
                </div>
                <div>
                  <p class="font-semibold text-lg mb-2">Date & Time</p>
                  <p class="text-sm text-muted-foreground">
                    <span class="font-medium">Start:</span>
                    {{ event()?.start_time | date: 'MMM d, y, h:mm a' }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    <span class="font-medium">End:</span>
                    {{ event()?.end_time | date: 'MMM d, y, h:mm a' }}
                  </p>
                </div>
              </div>

              <!-- Location -->
              <div class="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div
                  class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                >
                  <z-icon
                    [zType]="icons.mapPin"
                    class="text-primary w-6 h-6"
                  ></z-icon>
                </div>
                <div>
                  <p class="font-semibold text-lg mb-2">Location</p>
                  @if (event()?.event_type === 1) {
                    <a
                      [href]="event()?.online_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Join Online Meeting
                      <z-icon
                        [zType]="icons.externalLink"
                        class="w-3 h-3"
                      ></z-icon>
                    </a>
                  } @else {
                    <p class="text-sm font-medium">
                      {{ event()?.city }}, {{ event()?.region }}
                    </p>
                  }
                </div>
              </div>

              <!-- Category -->
              @if (event()?.category) {
                <div class="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div
                    class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                  >
                    <z-icon
                      [zType]="icons.folder"
                      class="text-primary w-6 h-6"
                    ></z-icon>
                  </div>
                  <div>
                    <p class="font-semibold text-lg mb-2">Category</p>
                    <p class="text-sm font-medium">
                      {{ event()?.category?.name }}
                    </p>
                  </div>
                </div>
              }

              <!-- Organization -->
              @if (event()?.organization) {
                <div class="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div
                    class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                  >
                    <z-icon
                      [zType]="icons.briefcase"
                      class="text-primary w-6 h-6"
                    ></z-icon>
                  </div>
                  <div>
                    <p class="font-semibold text-lg mb-2">Organizer</p>
                    <p class="text-sm font-medium">
                      {{ event()?.organization?.name }}
                    </p>
                  </div>
                </div>
              }
            </div>

            <z-divider></z-divider>

            <!-- Action Buttons -->
            <div
              class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4"
            >
              <button
                z-button
                zType="outline"
                (click)="goBack()"
                class="w-full sm:w-auto"
              >
                <z-icon [zType]="icons.arrowLeft" class="w-4 h-4 mr-2"></z-icon>
                Back to List
              </button>

              <div class="flex gap-2 w-full sm:w-auto">
                <button
                  z-button
                  zType="default"
                  (click)="editEvent()"
                  class="flex-1 sm:flex-none"
                >
                  <z-icon [zType]="icons.pencil" class="w-4 h-4 mr-2"></z-icon>
                  Edit Event
                </button>
                <button
                  z-button
                  zType="destructive"
                  (click)="deleteEvent()"
                  class="flex-1 sm:flex-none"
                >
                  <z-icon [zType]="icons.trash" class="w-4 h-4 mr-2"></z-icon>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Error State -->
        <div class="text-center py-12">
          <z-icon
            [zType]="icons.alertCircle"
            class="w-16 h-16 text-destructive mx-auto mb-4"
          ></z-icon>
          <h2 class="text-2xl font-bold mb-2">Event Not Found</h2>
          <p class="text-muted-foreground mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <button z-button zType="default" (click)="goBack()">
            <z-icon [zType]="icons.arrowLeft" class="w-4 h-4 mr-2"></z-icon>
            Back to Events
          </button>
        </div>
      }
    </div>
  `,
})
export class ViewEventComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);

  event = signal<Event | null>(null);
  loading = signal(true);

  // ✅ Properly typed icons
  readonly icons = {
    loader: 'loader' as ZardIcon,
    calendar: 'calendar' as ZardIcon,
    mapPin: 'map-pin' as ZardIcon,
    folder: 'folder' as ZardIcon,
    briefcase: 'briefcase' as ZardIcon,
    arrowLeft: 'arrow-left' as ZardIcon,
    pencil: 'pencil' as ZardIcon,
    trash: 'trash-2' as ZardIcon,
    externalLink: 'external-link' as ZardIcon,
    alertCircle: 'alert-circle' as ZardIcon,
  };

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadEvent(Number(id));
    } else {
      toast.error('Invalid event ID');
      this.router.navigate(['/events']);
    }
  }

  private loadEvent(id: number) {
    this.loading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (data) => {
        this.event.set(data);
        this.loading.set(false);
        console.log('✅ Event loaded:', data);
      },
      error: (err) => {
        console.error('❌ Error loading event:', err);
        toast.error('Event not found');
        this.loading.set(false);
        this.router.navigate(['/events']);
      },
    });
  }

  onImageError(event: any) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  editEvent() {
    if (this.event()) {
      console.log('📝 Navigating to edit event:', this.event()!.id);
      this.router.navigate(['/events/edit', this.event()!.id]);
    }
  }

  deleteEvent() {
    if (!this.event()) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${this.event()!.title}"?\n\nThis action cannot be undone.`,
    );

    if (confirmed) {
      this.eventService.deleteEvent(this.event()!.id).subscribe({
        next: () => {
          toast.success('Event deleted successfully');
          this.router.navigate(['/events']);
        },
        error: (err) => {
          console.error('❌ Error deleting event:', err);
          toast.error('Failed to delete event');
        },
      });
    }
  }
}
