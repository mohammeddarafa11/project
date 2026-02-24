// src/app/features/events/modals/view-event-modal.ts
import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Event as EventModel, EventType } from '@core/models/event.model';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';

@Component({
  selector: 'app-view-event-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, ZardButtonComponent, ZardIconComponent, ZardDividerComponent],
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(3px);
    }
    .modal-box {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 16px;
      border: 1px solid hsl(var(--border));
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
    }
    .info-tile {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: hsl(var(--muted) / 0.5);
    }
    .tile-icon {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: hsl(var(--primary) / 0.1);
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 7px;
      border: none; background: transparent;
      color: hsl(var(--muted-foreground));
      cursor: pointer; transition: background 0.15s;
      position: absolute; top: 10px; right: 10px;
    }
    .close-btn:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
  `],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <!-- Image / placeholder header -->
        <div style="position:relative">
          @if (event().event_img_url) {
            <img [src]="event().event_img_url" [alt]="event().title"
              style="width:100%;height:200px;object-fit:cover;border-radius:16px 16px 0 0;display:block"
              (error)="onImgErr($event)" />
          } @else {
            <div style="
              width:100%;height:140px;
              background:linear-gradient(135deg,hsl(var(--primary)/0.15),hsl(var(--primary)/0.05));
              border-radius:16px 16px 0 0;
              display:flex;align-items:center;justify-content:center">
              <z-icon zType="calendar" style="width:48px;height:48px;color:hsl(var(--primary)/0.3)" />
            </div>
          }
          <button class="close-btn" (click)="onClose()">
            <z-icon zType="x" style="width:16px;height:16px" />
          </button>
        </div>

        <!-- Body -->
        <div style="padding:22px;display:flex;flex-direction:column;gap:16px">

          <!-- Title + status -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <h2 style="font-size:22px;font-weight:700;margin:0;color:hsl(var(--foreground));line-height:1.3">
              {{ event().title }}
            </h2>
            <span style="
              font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;flex-shrink:0;
              background:{{ isUpcoming() ? 'hsl(142 76% 73% / 0.2)' : 'hsl(var(--muted))' }};
              color:{{ isUpcoming() ? 'hsl(142 71% 35%)' : 'hsl(var(--muted-foreground))' }}">
              {{ isUpcoming() ? 'Upcoming' : 'Past' }}
            </span>
          </div>

          <!-- Description -->
          <p style="font-size:14px;color:hsl(var(--muted-foreground));line-height:1.6;margin:0">
            {{ event().description }}
          </p>

          <z-divider />

          <!-- Info tiles grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">

            <!-- Date & Time -->
            <div class="info-tile">
              <div class="tile-icon">
                <z-icon zType="calendar" style="width:16px;height:16px;color:hsl(var(--primary))" />
              </div>
              <div>
                <p style="font-size:11px;font-weight:700;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px">Date & Time</p>
                <p style="font-size:13px;font-weight:600;margin:0;color:hsl(var(--foreground))">
                  {{ event().start_time | date: 'MMM d, y' }}
                </p>
                <p style="font-size:12px;color:hsl(var(--muted-foreground));margin:0">
                  {{ event().start_time | date: 'h:mm a' }} – {{ event().end_time | date: 'h:mm a' }}
                </p>
              </div>
            </div>

            <!-- Location -->
            <div class="info-tile">
              <div class="tile-icon">
                <z-icon zType="map-pin" style="width:16px;height:16px;color:hsl(var(--primary))" />
              </div>
              <div>
                <p style="font-size:11px;font-weight:700;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px">Location</p>
                @if (event().event_type === EventType.Online) {
                  <a [href]="event().online_url" target="_blank" rel="noopener noreferrer"
                    style="font-size:13px;font-weight:600;color:hsl(var(--primary));text-decoration:none">
                    Join Online →
                  </a>
                } @else {
                  <p style="font-size:13px;font-weight:600;margin:0;color:hsl(var(--foreground))">
                    {{ event().city }}, {{ event().region }}
                  </p>
                }
              </div>
            </div>

            <!-- Category -->
            @if (event().category?.name) {
              <div class="info-tile">
                <div class="tile-icon">
                  <z-icon zType="folder-open" style="width:16px;height:16px;color:hsl(var(--primary))" />
                </div>
                <div>
                  <p style="font-size:11px;font-weight:700;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px">Category</p>
                  <p style="font-size:13px;font-weight:600;margin:0;color:hsl(var(--foreground))">{{ event().category.name }}</p>
                </div>
              </div>
            }

            <!-- Organizer -->
            @if (event().organization?.name) {
              <div class="info-tile">
                <div class="tile-icon">
                  <z-icon zType="user-plus" style="width:16px;height:16px;color:hsl(var(--primary))" />
                </div>
                <div>
                  <p style="font-size:11px;font-weight:700;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px">Organizer</p>
                  <p style="font-size:13px;font-weight:600;margin:0;color:hsl(var(--foreground))">{{ event().organization.name }}</p>
                </div>
              </div>
            }

          </div>

          <z-divider />

          <!-- Footer actions -->
          <div style="display:flex;justify-content:space-between;align-items:center">
            <button z-button zType="ghost" (click)="onClose()">Close</button>
            <button z-button zType="default" (click)="onEdit()">
              <z-icon zType="pencil" class="w-4 h-4 mr-2" />
              Edit Event
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class ViewEventModalComponent {
  event = input.required<EventModel>();
  edit = output<void>();
  close = output<void>();

  readonly EventType = EventType;

  isUpcoming() { return new Date(this.event().start_time) > new Date(); }
  onImgErr(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
  onEdit() { this.edit.emit(); }
  onClose() { this.close.emit(); }
}