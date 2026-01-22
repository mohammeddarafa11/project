// src/app/features/events/view-event/view-event.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ZARD_ICONS } from '@shared/components/icon/icons';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '@core/services/event.service';
import { Event } from '@core/models/event.model';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-view-event',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardDividerComponent,
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <z-icon
            zType="loader"
            class="animate-spin text-primary w-8 h-8"
          ></z-icon>
        </div>
      } @else if (event()) {
        <div z-card class="overflow-hidden">
          @if (event()?.event_img_url) {
            <div class="relative h-64 w-full overflow-hidden">
              <img
                [src]="event()!.event_img_url"
                [alt]="event()!.title"
                class="w-full h-full object-cover"
                (error)="onImageError($event)"
              />
            </div>
          } @else {
            <div
              class="w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
            >
              <z-icon
                zType="calendar"
                class="w-16 h-16 text-primary/40"
              ></z-icon>
            </div>
          }

          <div class="p-6 space-y-6">
            <div>
              <h1 class="text-3xl font-bold mb-2">{{ event()?.title }}</h1>
              <p class="text-muted-foreground">{{ event()?.description }}</p>
            </div>

            <div z-divider></div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start gap-3">
                <z-icon zType="calendar" class="text-primary mt-1"></z-icon>
                <div>
                  <p class="font-semibold mb-1">Date & Time</p>
                  <p class="text-sm text-muted-foreground">
                    Start: {{ event()?.start_time | date: 'medium' }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    End: {{ event()?.end_time | date: 'medium' }}
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <!-- <z-icon zType="map-pin" class="text-primary mt-1"></z-icon> -->
                <div>
                  <p class="font-semibold mb-1">Location</p>
                  @if (event()?.event_type === 1) {
                    <a
                      [href]="event()?.online_url"
                      target="_blank"
                      class="text-sm text-blue-600 hover:underline"
                    >
                      Join Online Meeting →
                    </a>
                  } @else {
                    <p class="text-sm text-muted-foreground">
                      {{ event()?.city }}, {{ event()?.region }}
                    </p>
                  }
                </div>
              </div>

              @if (event()?.category) {
                <div class="flex items-start gap-3">
                  <z-icon zType="folder" class="text-primary mt-1"></z-icon>
                  <div>
                    <p class="font-semibold mb-1">Category</p>
                    <p class="text-sm text-muted-foreground">
                      {{ event()?.category?.name }}
                    </p>
                  </div>
                </div>
              }
            </div>

            <div z-divider></div>

            <div class="flex justify-between items-center pt-4">
              <button z-button zType="outline" (click)="goBack()">
                <z-icon zType="arrow-left" class="w-4 h-4 mr-2"></z-icon>
                Back to List
              </button>

              <div class="flex gap-2">
                <button z-button zType="outline" (click)="editEvent()">
                  <z-icon [zType]="icons.pencil" class="w-4 h-4 mr-2"></z-icon>
                  Edit Event
                </button>
                <button z-button zType="destructive" (click)="deleteEvent()">
                  <z-icon zType="trash" class="w-4 h-4 mr-2"></z-icon>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ViewEventComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  protected readonly icons = ZARD_ICONS;
  event = signal<Event | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadEvent(Number(id));
    }
  }

  private loadEvent(id: number) {
    this.loading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (data) => {
        this.event.set(data);
        this.loading.set(false);
      },
      error: () => {
        toast.error('Event not found');
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
      this.router.navigate(['/events/edit', this.event()!.id]);
    }
  }

  deleteEvent() {
    if (!this.event()) return;

    if (confirm(`Are you sure you want to delete "${this.event()!.title}"?`)) {
      this.eventService.deleteEvent(this.event()!.id).subscribe({
        next: () => {
          toast.success('Event deleted successfully');
          this.router.navigate(['/events']);
        },
        error: () => {
          // Error handled by interceptor
        },
      });
    }
  }
}
