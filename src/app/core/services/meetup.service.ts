// src/app/core/services/meetup.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Meetup, CreateMeetupDto, UpdateMeetupDto, ServiceResponse } from '@core/models/meetup.model';

@Injectable({ providedIn: 'root' })
export class MeetupService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://eventora.runasp.net/api/Meetup';

  // ── Queries ───────────────────────────────────────────────────────────────

  /** GET /api/Meetup/AllDetails */
  getAllDetails(): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/AllDetails`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/allMeetups */
  getAllMeetups(): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/allMeetups`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /**
   * Returns all meetups with resolved IDs.
   * Falls back to getAllDetails() — IDs are now returned correctly by the API.
   */
  getAllMeetupsWithIds(): Observable<Meetup[]> {
    return this.getAllDetails();
  }

  /** GET /api/Meetup/{id} */
  getMeetupById(id: number): Observable<Meetup> {
    return this.http.get<ServiceResponse<Meetup>>(`${this.base}/${id}`).pipe(
      map(r => r.data),
      catchError(this.err),
    );
  }

  /** GET /api/Meetup/Details?meetupId= */
  getMeetupDetails(meetupId: number): Observable<Meetup> {
    const params = new HttpParams().set('meetupId', meetupId);
    return this.http.get<ServiceResponse<Meetup>>(`${this.base}/Details`, { params }).pipe(
      map(r => r.data),
      catchError(this.err),
    );
  }

  /** GET /api/Meetup/upcoming */
  getUpcoming(): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/upcoming`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/online */
  getOnline(): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/online`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/offline */
  getOffline(): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/offline`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/joinedmeetupsbyuser/{userId} */
  getJoinedByUser(userId: number): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/joinedmeetupsbyuser/${userId}`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/createdmeetupsbyuser/{userId} */
  getCreatedByUser(userId: number): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/createdmeetupsbyuser/${userId}`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/category/{categoryId} */
  getByCategory(categoryId: number): Observable<Meetup[]> {
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/category/${categoryId}`).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  /** GET /api/Meetup/nearby?userLat=&userLon=&radiusInKm= */
  getNearby(userLat: number, userLon: number, radiusInKm: number): Observable<Meetup[]> {
    const params = new HttpParams()
      .set('userLat', userLat)
      .set('userLon', userLon)
      .set('radiusInKm', radiusInKm);
    return this.http.get<ServiceResponse<Meetup[]>>(`${this.base}/nearby`, { params }).pipe(
      map(r => this.unwrapList(r)),
      catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
    );
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** POST /api/Meetup */
  createMeetup(dto: CreateMeetupDto): Observable<void> {
    return this.http.post<void>(this.base, dto).pipe(
      map(() => undefined),
      catchError(this.err),
    );
  }

  /** PUT /api/Meetup/{id} */
  updateMeetup(id: number, dto: UpdateMeetupDto): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto).pipe(
      map(() => undefined),
      catchError(this.err),
    );
  }

  /** DELETE /api/Meetup/{id} */
  deleteMeetup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      map(() => undefined),
      catchError(this.err),
    );
  }

  /** POST /api/Meetup/{meetupId}/join */
  joinMeetup(meetupId: number): Observable<void> {
    if (!meetupId) return throwError(() => ({ error: { message: 'Invalid meetup ID.' } }));
    return this.http.post<void>(`${this.base}/${meetupId}/join`, {}).pipe(
      map(() => undefined),
      catchError(this.err),
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private unwrapList(r: ServiceResponse<Meetup[]>): Meetup[] {
    return r.data ?? [];
  }

  private err = (e: HttpErrorResponse): Observable<never> => {
    const msg = e.error?.message
      || (Array.isArray(e.error?.errors) && e.error.errors[0])
      || e.message
      || 'An error occurred';
    console.error('[MeetupService]', e.status, msg);
    return throwError(() => ({ error: { message: msg } }));
  };
}