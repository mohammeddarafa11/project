// src/app/features/events/pipes/filter-events.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Event as EventModel } from '@core/models/event.model';

export type EventLocationFilter  = 'all' | 'online' | 'inperson';
export type EventStatusFilter    = 'all' | 'upcoming' | 'past';
export type EventVisibilityFilter = 'all' | 'public' | 'private';

// Keep the old name as an alias so existing code doesn't break
export type EventTypeFilter = EventLocationFilter;

export interface EventFilters {
  search:     string;
  eventType:  EventLocationFilter;   // online / inperson  → event_location_type
  visibility: EventVisibilityFilter; // public / private   → event_type
  status:     EventStatusFilter;
  categoryId: number | null;
  dateFrom:   Date | null;
  dateTo:     Date | null;
}

export const DEFAULT_FILTERS: EventFilters = {
  search:     '',
  eventType:  'all',
  visibility: 'all',
  status:     'all',
  categoryId: null,
  dateFrom:   null,
  dateTo:     null,
};

@Pipe({
  name: 'filterEvents',
  standalone: true,
  pure: true,
})
export class FilterEventsPipe implements PipeTransform {
  transform(events: EventModel[], filters: EventFilters): EventModel[] {
    if (!events?.length) return [];

    const now    = new Date();
    const search = filters.search.trim().toLowerCase();

    return events.filter((event) => {

      // ── Search ────────────────────────────────────────────────────────────
      if (search) {
        const inTitle = event.title?.toLowerCase().includes(search);
        const inDesc  = event.description?.toLowerCase().includes(search);
        if (!inTitle && !inDesc) return false;
      }

      // ── Location format  (event_location_type: 0=Online, 1=Offline) ──────
      if (filters.eventType === 'online'   && event.event_location_type !== 0) return false;
      if (filters.eventType === 'inperson' && event.event_location_type !== 1) return false;

      // ── Visibility  (event_type: 0=Public, 1=Private) ────────────────────
      if (filters.visibility === 'public'  && event.event_type !== 0) return false;
      if (filters.visibility === 'private' && event.event_type !== 1) return false;

      // ── Status ───────────────────────────────────────────────────────────
      const isUpcoming = new Date(event.start_time) > now;
      if (filters.status === 'upcoming' && !isUpcoming) return false;
      if (filters.status === 'past'     &&  isUpcoming) return false;

      // ── Category ─────────────────────────────────────────────────────────
      if (filters.categoryId !== null && event.categoryId !== filters.categoryId) return false;

      // ── Date range ───────────────────────────────────────────────────────
      const eventDate = new Date(event.start_time);
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (eventDate < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (eventDate > to) return false;
      }

      return true;
    });
  }
}