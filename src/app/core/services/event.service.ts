// services/event.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  ServiceResponse,
} from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly baseURL = 'https://eventora.runasp.net/api/Event';

  constructor(private http: HttpClient) {}

  // GET /api/Event - Get all events
  getAllEvents(): Observable<Event[]> {
    return this.http.get<ServiceResponse<Event[]>>(this.baseURL).pipe(
      map((response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch events');
      }),
      catchError(this.handleError),
    );
  }

  // GET /api/Event/{id} - Get event by ID
  getEventById(id: number): Observable<Event> {
    return this.http.get<ServiceResponse<Event>>(`${this.baseURL}/${id}`).pipe(
      map((response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch event');
      }),
      catchError(this.handleError),
    );
  }

  // GET /api/Event/organization - Get events by organization
  getEventsByOrganization(organizationId: number): Observable<Event[]> {
    const params = new HttpParams().set(
      'organizationId',
      organizationId.toString(),
    );
    return this.http
      .get<ServiceResponse<Event[]>>(`${this.baseURL}/organization`, { params })
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to fetch events');
        }),
        catchError(this.handleError),
      );
  }

  // GET /api/Event/Category - Get events by category
  getEventsByCategory(categoryId: number): Observable<Event[]> {
    const params = new HttpParams().set('categoryId', categoryId.toString());
    return this.http
      .get<ServiceResponse<Event[]>>(`${this.baseURL}/Category`, { params })
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to fetch events');
        }),
        catchError(this.handleError),
      );
  }

  // POST /api/Event - Create new event
  createEvent(dto: CreateEventDto): Observable<Event> {
    return this.http.post<ServiceResponse<Event>>(this.baseURL, dto).pipe(
      map((response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create event');
      }),
      catchError(this.handleError),
    );
  }

  // PUT /api/Event/{id} - Update event
  updateEvent(id: number, dto: UpdateEventDto): Observable<Event> {
    return this.http
      .put<ServiceResponse<Event>>(`${this.baseURL}/${id}`, dto)
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to update event');
        }),
        catchError(this.handleError),
      );
  }

  // DELETE /api/Event/{id} - Delete event
  deleteEvent(id: number): Observable<any> {
    return this.http.delete<ServiceResponse<any>>(`${this.baseURL}/${id}`).pipe(
      map((response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to delete event');
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors?.length) {
        errorMessage = error.error.errors.join(', ');
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
