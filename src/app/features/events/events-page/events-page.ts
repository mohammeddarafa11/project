// src/app/features/events/events-page/events-page.ts
import {
 Component,
 computed,
 HostListener,
 inject,
 OnInit,
 signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { EventService } from '@core/services/event.service';
import { Event as EventModel, EventType } from '@core/models/event.model';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { toast } from 'ngx-sonner';

import { CreateEventModalComponent } from '../modals/create-event-modal';
import { EditEventModalComponent } from '../modals/edit-event-modal';
import { ViewEventModalComponent } from '../modals/view-event-modal';

interface StatCard {
 icon: ZardIcon;
 label: string;
 value: number;
 bgColor: string;
 iconColor: string;
}

@Component({
 selector: 'app-events-page',
 standalone: true,
 imports: [
   CommonModule,
   DatePipe,
   ZardButtonComponent,
   ZardIconComponent,
   ZardCardComponent,
   CreateEventModalComponent,
   EditEventModalComponent,
   ViewEventModalComponent,
 ],
  styles: [`
   .three-dots-btn {
     display: flex; flex-direction: column; align-items: center; justify-content: center;
     gap: 3.5px; width: 30px; height: 30px; padding: 0;
     border: none; border-radius: 999px; background: transparent;
     cursor: pointer; flex-shrink: 0; transition: background-color 0.15s ease;
   }
   .three-dots-btn:hover { background-color: rgba(148, 163, 184, 0.18); }
   .three-dots-btn .dot {
     display: block; width: 4px; height: 4px; border-radius: 999px;
     background: var(--foreground); opacity: 0.9; transition: opacity 0.15s ease;
   }
   .three-dots-btn:hover .dot { opacity: 1; }

   .event-menu-dropdown {
     position: absolute; right: 0; top: calc(100% + 0.5rem);
     z-index: 50; min-width: 11rem; padding: 0.25rem;
     border-radius: 0.625rem; border: 1px solid var(--border);
     background: var(--popover); color: var(--popover-foreground);
     box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 10px 25px -3px rgba(0,0,0,0.12);
   }
   .event-menu-dropdown .menu-item {
     display: flex; align-items: center; gap: 0.55rem; width: 100%;
     padding: 0.45rem 0.65rem; border: none; border-radius: 0.375rem; background: transparent;
     color: var(--foreground); font-size: 0.8rem; font-weight: 500;
     text-align: left; cursor: pointer; transition: background-color 0.1s ease;
   }
   .event-menu-dropdown .menu-item:hover { background-color: rgba(148, 163, 184, 0.18); }
   .event-menu-dropdown .menu-item.danger { color: var(--destructive); }
   .event-menu-dropdown .menu-item.danger:hover { background-color: rgba(239, 68, 68, 0.08); }
   .event-menu-dropdown .menu-sep { height: 1px; margin: 3px 0; background: var(--border); }
 `],
  template: `
   <div class="px-4 py-4 sm:p-6 space-y-5 sm:space-y-6">

     <!-- Header -->
     <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
       <div class="space-y-1">
         <h1 class="text-3xl font-bold">Events</h1>
         <p class="text-muted-foreground text-sm sm:text-base">Manage all your organization's events</p>
       </div>
       <button
         z-button
         zType="default"
         class="w-full sm:w-auto justify-center"
         (click)="openCreateModal()"
       >
         <z-icon zType="plus" class="w-4 h-4 mr-2" />
         Create Event
       </button>
     </div>

     <!-- Stat Cards -->
     <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

     <!-- Events List -->
     @if (loading()) {
       <div class="flex flex-col items-center justify-center py-20">
         <z-icon zType="loader" class="w-10 h-10 animate-spin text-primary mb-3" />
         <p class="text-muted-foreground">Loading events...</p>
       </div>

     } @else if (events().length === 0) {
       <div z-card class="flex flex-col items-center justify-center py-16 px-4 text-center">
         <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
           <z-icon zType="calendar" class="w-10 h-10 text-muted-foreground" />
         </div>
         <h3 class="text-xl font-semibold mb-2">No events yet</h3>
         <p class="text-muted-foreground mb-6 max-w-sm">Get started by creating your first event.</p>
         <button z-button zType="default" (click)="openCreateModal()">
           <z-icon zType="plus" class="w-4 h-4 mr-2" />Create Your First Event
         </button>
       </div>

     } @else {
       <div class="space-y-4">
         @for (event of events(); track event.id) {
           <div
             z-card
            class="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
             (click)="openViewModal(event)"
           >
            <div class="flex flex-col sm:flex-row">

               <!-- Thumbnail -->
              <div class="w-full sm:w-44 sm:shrink-0">
                 @if (event.event_img_url) {
                  <img
                    [src]="event.event_img_url"
                    [alt]="event.title"
                    class="w-full h-40 sm:h-full object-cover"
                    (error)="onImageError($event)"
                  />
                 } @else {
                  <div
                    class="w-full h-40 sm:h-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center"
                  >
                     <z-icon zType="calendar" class="w-10 h-10 text-primary/30" />
                   </div>
                 }
               </div>

               <!-- Content -->
              <div class="flex-1 p-4 sm:p-5 min-w-0">
                <div class="flex items-start gap-3">
                   <div class="flex-1 min-w-0">

                     <!-- Badges -->
                     <div class="flex flex-wrap items-center gap-2 mb-2">
                       @if (event.category?.name) {
                         <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                           {{ event.category.name }}
                         </span>
                       }
                       <span class="text-xs font-medium px-2.5 py-0.5 rounded-full"
                         [class]="event.event_type === EventType.Online
                           ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'">
                         {{ event.event_type === EventType.Online ? 'Online' : 'In-Person' }}
                       </span>
                       <span class="text-xs font-medium px-2.5 py-0.5 rounded-full ml-auto"
                         [class]="isUpcoming(event) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                         {{ isUpcoming(event) ? 'Upcoming' : 'Ended' }}
                       </span>
                     </div>

                     <h3 class="font-semibold text-base sm:text-lg leading-snug line-clamp-1 mb-1">
                       {{ event.title }}
                     </h3>

                     @if (event.organization?.name) {
                       <p class="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                         <z-icon zType="user-plus" class="w-3.5 h-3.5 shrink-0" />
                         {{ event.organization.name }}
                       </p>
                     }

                     <p class="text-sm text-muted-foreground line-clamp-2 mb-3">
                       {{ event.description }}
                     </p>

                     <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                       <span class="flex items-center gap-1">
                         <z-icon zType="map-pin" class="w-3.5 h-3.5 shrink-0" />
                         @if (event.event_type === EventType.Online) { Online Event }
                         @else { {{ event.city }}, {{ event.region }} }
                       </span>
                       <span class="flex items-center gap-1">
                         <z-icon zType="calendar" class="w-3.5 h-3.5 shrink-0" />
                         {{ event.start_time | date: 'MMM d, y' }}
                       </span>
                       <span class="flex items-center gap-1">
                         <z-icon zType="clock" class="w-3.5 h-3.5 shrink-0" />
                         {{ event.start_time | date: 'h:mm a' }}
                       </span>
                     </div>
                   </div>

                   <!-- 3-dot menu -->
                   <div class="relative self-start" (click)="$event.stopPropagation()">
                     <button class="three-dots-btn" (click)="toggleMenu(event.id)" title="Actions">
                       <span class="dot"></span>
                       <span class="dot"></span>
                       <span class="dot"></span>
                     </button>
                     @if (openMenuId() === event.id) {
                       <div class="event-menu-dropdown">
                         <button class="menu-item" (click)="openViewModal(event)">
                           <z-icon zType="eye" class="w-4 h-4 shrink-0" />View Details
                         </button>
                         <button class="menu-item" (click)="openEditModal(event)">
                           <z-icon zType="pencil" class="w-4 h-4 shrink-0" />Edit Event
                         </button>
                         <div class="menu-sep"></div>
                         <button class="menu-item danger" (click)="deleteEvent(event)">
                           <z-icon zType="trash" class="w-4 h-4 shrink-0" />Delete Event
                         </button>
                       </div>
                     }
                   </div>

                 </div>
               </div>
             </div>
           </div>
         }
       </div>
     }
   </div>

   <!-- Modals -->
   @if (showCreateModal()) {
     <app-create-event-modal (created)="onEventCreated()" (close)="showCreateModal.set(false)" />
   }
   @if (showEditModal() && selectedEvent()) {
     <app-edit-event-modal
       [event]="selectedEvent()!"
       (updated)="onEventUpdated($event)"
       (close)="showEditModal.set(false)"
     />
   }
   @if (showViewModal() && selectedEvent()) {
     <app-view-event-modal
       [event]="selectedEvent()!"
       (edit)="switchToEdit()"
       (close)="showViewModal.set(false)"
     />
   }
 `,
})
export class EventsPageComponent implements OnInit {
 private eventService = inject(EventService);

 events = signal<EventModel[]>([]);
 loading = signal(false);
 showCreateModal = signal(false);
 showEditModal = signal(false);
 showViewModal = signal(false);
 selectedEvent = signal<EventModel | null>(null);
 openMenuId = signal<number | null>(null);

 readonly EventType = EventType;

 statsCards = computed<StatCard[]>(() => {
   const now = new Date();
   const all = this.events();
   const upcoming = all.filter((e) => new Date(e.start_time) > now).length;
   const past = all.filter((e) => new Date(e.start_time) <= now).length;
   return [
     { icon: 'calendar' as ZardIcon, label: 'Total Events', value: all.length, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
     { icon: 'clock' as ZardIcon, label: 'Upcoming Events', value: upcoming, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
     { icon: 'archive' as ZardIcon, label: 'Past Events', value: past, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
   ];
 });

 ngOnInit() { this.loadEvents(); }

 @HostListener('document:click')
 onDocumentClick() { if (this.openMenuId() !== null) this.openMenuId.set(null); }

 private loadEvents() {
   this.loading.set(true);
   this.eventService.getAllEvents().subscribe({
     next: (data) => { this.events.set(data); this.loading.set(false); },
     error: () => { this.loading.set(false); },
   });
 }

 openCreateModal() { this.selectedEvent.set(null); this.showCreateModal.set(true); }

 openEditModal(event: EventModel) {
   this.openMenuId.set(null);
   this.selectedEvent.set(event);
   this.showViewModal.set(false);
   this.showEditModal.set(true);
 }

 openViewModal(event: EventModel) {
   this.openMenuId.set(null);
   this.selectedEvent.set(event);
   this.showViewModal.set(true);
 }

 switchToEdit() { this.showViewModal.set(false); this.showEditModal.set(true); }

 onEventCreated() { this.showCreateModal.set(false); this.loadEvents(); }

 // ✅ Receives the fully merged EventModel — patches list in-place, no refetch needed
 onEventUpdated(updatedEvent: EventModel) {
   this.showEditModal.set(false);

   // Replace the matching event in the list with the merged version
   this.events.update((list) =>
     list.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
   );

   // Also update selectedEvent so view modal stays fresh if opened again
   this.selectedEvent.set(updatedEvent);
 }

 deleteEvent(event: EventModel) {
   this.openMenuId.set(null);
   if (!confirm(`Delete "${event.title}"?\n\nThis action cannot be undone.`)) return;
   this.eventService.deleteEvent(event.id).subscribe({
     next: () => { this.events.update((l) => l.filter((e) => e.id !== event.id)); toast.success('Event deleted'); },
     error: () => toast.error('Failed to delete event'),
   });
 }

 toggleMenu(id: number) { this.openMenuId.set(this.openMenuId() === id ? null : id); }
 isUpcoming(event: EventModel) { return new Date(event.start_time) > new Date(); }
 onImageError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}