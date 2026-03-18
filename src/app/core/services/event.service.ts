// src/app/core/services/event.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  ServiceResponse,
} from '../models/event.model';

// ─── Extra DTOs (kept here to avoid breaking existing imports) ────────────────

export interface TicketTierDto {
  eventTicketId:  number;
  tier:           number;
  price:          number;
  totalQuantity:  number;
  soldQuantity:   number;
  remainingSpots: number;
  isSoldOut:      boolean;
}

export interface EventDetailsDto {
  id:               number;
  title:            string | null;
  startTime:        string;
  endTime:          string;
  description:      string | null;
  maxParticipants:  number;
  currentAttendees: number;
  remainingSpots:   number;
  isFull:           boolean;
  city:             string | null;
  region:           string | null;
  street:           string | null;
  nameOfPlace:      string | null;
  onlineUrl:        string | null;
  eventImgUrl:      string | null;
  eventLocationType: number;
  eventType:        number;
  categoryId:       number;
  organizationId:   number;
  ticketsDetailsDto: TicketTierDto[] | null;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly baseURL = 'https://eventora.runasp.net/api/Event';

  constructor(private http: HttpClient) {}

  // ── Helper ────────────────────────────────────────────────────────────────

  // Normalises both snake_case and camelCase API responses into the Event model.
  private mapEvent(e: any): Event {
    return {
      ...e,
      start_time:          e.start_time          ?? e.startTime,
      end_time:            e.end_time             ?? e.endTime,
      event_img_url:       e.event_img_url        ?? e.eventImgUrl,
      event_location_type: e.event_location_type  ?? e.eventLocationType,
      event_type:          e.event_type           ?? e.eventType,
      online_url:          e.online_url            ?? e.onlineUrl,
      nameOfPlace:         e.nameOfPlace          ?? e.name_of_place,
    };
  }

  private mapEvents(data: any[]): Event[] {
    return data.map(e => this.mapEvent(e));
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** GET /api/Event */
  getAllEvents(): Observable<Event[]> {
    return this.http.get<ServiceResponse<any[]>>(this.baseURL).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/{id} */
  getEventById(id: number): Observable<Event> {
    return this.http.get<ServiceResponse<any>>(`${this.baseURL}/${id}`).pipe(
      map(r => this.mapEvent(r.data)),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/AllEventsDetails */
  getAllDetails(): Observable<EventDetailsDto[]> {
    return this.http.get<ServiceResponse<EventDetailsDto[]>>(`${this.baseURL}/AllEventsDetails`).pipe(
      map(r => r.data ?? []),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/Details/{id} */
  getEventDetails(id: number): Observable<EventDetailsDto> {
    return this.http.get<ServiceResponse<EventDetailsDto>>(`${this.baseURL}/Details/${id}`).pipe(
      map(r => r.data),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/PublicEvents */
  getPublicEvents(): Observable<Event[]> {
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/PublicEvents`).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/PrivateEventsByUserId */
  getPrivateEventsByUser(): Observable<Event[]> {
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/PrivateEventsByUserId`).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/upcoming */
  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/upcoming`).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/online */
  getOnlineEvents(): Observable<Event[]> {
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/online`).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/offline */
  getOfflineEvents(): Observable<Event[]> {
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/offline`).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/nearby?UserLat=&UserLon=&radiusInKm= */
  getNearbyEvents(userLat: number, userLon: number, radiusInKm: number): Observable<Event[]> {
    const params = new HttpParams()
      .set('UserLat', userLat)
      .set('UserLon', userLon)
      .set('radiusInKm', radiusInKm);
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/nearby`, { params }).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/organization?organizationId= */
  getEventsByOrganization(organizationId: number): Observable<Event[]> {
    const params = new HttpParams().set('organizationId', organizationId.toString());
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/organization`, { params }).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  /** GET /api/Event/Category?categoryId= */
  getEventsByCategory(categoryId: number): Observable<Event[]> {
    const params = new HttpParams().set('categoryId', categoryId.toString());
    return this.http.get<ServiceResponse<any[]>>(`${this.baseURL}/Category`, { params }).pipe(
      map(r => this.mapEvents(r.data ?? [])),
      catchError(this.handleError),
    );
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** POST /api/Event */
  createEvent(dto: CreateEventDto): Observable<Event> {
    return this.http.post<ServiceResponse<any>>(this.baseURL, dto).pipe(
      map(r => this.mapEvent(r.data)),
      catchError(this.handleError),
    );
  }

  /** PUT /api/Event/{id} */
  updateEvent(id: number, dto: UpdateEventDto): Observable<Event> {
    return this.http.put<ServiceResponse<any>>(`${this.baseURL}/${id}`, dto).pipe(
      map(r => this.mapEvent(r.data)),
      catchError(this.handleError),
    );
  }

  /** DELETE /api/Event/{id} */
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<ServiceResponse<unknown>>(`${this.baseURL}/${id}`).pipe(
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred';
    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else {
      message = error.error?.message
        || (Array.isArray(error.error?.errors) && error.error.errors.join(', '))
        || error.message;
    }
    console.error('[EventService]', error.status, message);
    return throwError(() => ({ error: { message } }));
  }
}