// src/app/core/services/meetup.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Meetup,
  MeetupAllDetailsDto,
  mapAllDetailsDto,
  CreateMeetupDto,
  UpdateMeetupDto,
  ServiceResponse,
} from '@core/models/meetup.model';

@Injectable({ providedIn: 'root' })
export class MeetupService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://eventora.runasp.net/api/Meetup';

  // ── Queries ───────────────────────────────────────────────────────────────

  getAllDetails(): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<MeetupAllDetailsDto[]>>(`${this.base}/AllDetails`)
      .pipe(
        map(r => (r?.data ?? []).map(mapAllDetailsDto)),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  getAllMeetups(): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<Meetup[]>>(`${this.base}/allMeetups`)
      .pipe(
        map(r => r?.data ?? []),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  getAllMeetupsWithIds(): Observable<Meetup[]> {
    return this.getAllDetails();
  }

  getMeetupById(id: number): Observable<Meetup> {
    return this.http
      .get<ServiceResponse<Meetup>>(`${this.base}/${id}`)
      .pipe(map(r => r.data), catchError(this.err));
  }

  getMeetupDetails(meetupId: number): Observable<Meetup> {
    const params = new HttpParams().set('meetupId', meetupId);
    return this.http
      .get<ServiceResponse<Meetup>>(`${this.base}/Details`, { params })
      .pipe(map(r => r.data), catchError(this.err));
  }

  getUpcoming(): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<Meetup[]>>(`${this.base}/upcoming`)
      .pipe(
        map(r => r?.data ?? []),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  getOnline(): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<Meetup[]>>(`${this.base}/online`)
      .pipe(
        map(r => r?.data ?? []),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  getOffline(): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<Meetup[]>>(`${this.base}/offline`)
      .pipe(
        map(r => r?.data ?? []),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  /**
   * GET /api/Meetup/joinedmeetupsbyuser/{userId}
   * Same flat DTO shape as AllDetails → map through mapAllDetailsDto.
   */
  getJoinedByUser(userId: number): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<MeetupAllDetailsDto[]>>(
        `${this.base}/joinedmeetupsbyuser/${userId}`,
      )
      .pipe(
        map(r => (r?.data ?? []).map(mapAllDetailsDto)),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  /**
   * GET /api/Meetup/createdmeetupsbyuser/{userId}
   * Same flat DTO shape as AllDetails → map through mapAllDetailsDto.
   */
  getCreatedByUser(userId: number): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<MeetupAllDetailsDto[]>>(
        `${this.base}/createdmeetupsbyuser/${userId}`,
      )
      .pipe(
        map(r => (r?.data ?? []).map(mapAllDetailsDto)),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  getByCategory(categoryId: number): Observable<Meetup[]> {
    return this.http
      .get<ServiceResponse<Meetup[]>>(`${this.base}/category/${categoryId}`)
      .pipe(
        map(r => r?.data ?? []),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  getNearby(userLat: number, userLon: number, radiusInKm: number): Observable<Meetup[]> {
    const params = new HttpParams()
      .set('userLat', userLat).set('userLon', userLon).set('radiusInKm', radiusInKm);
    return this.http
      .get<ServiceResponse<Meetup[]>>(`${this.base}/nearby`, { params })
      .pipe(
        map(r => r?.data ?? []),
        catchError((e: HttpErrorResponse) => e.status === 404 ? of([]) : this.err(e)),
      );
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  createMeetup(dto: CreateMeetupDto): Observable<true> {
    return this.http.post<any>(this.base, dto).pipe(
      map(() => true as true), catchError(this.err));
  }

  updateMeetup(id: number, dto: UpdateMeetupDto): Observable<true> {
    return this.http.put<any>(`${this.base}/${id}`, dto).pipe(
      map(() => true as true), catchError(this.err));
  }

  deleteMeetup(id: number): Observable<true> {
    return this.http.delete<any>(`${this.base}/${id}`).pipe(
      map(() => true as true), catchError(this.err));
  }

  joinMeetup(meetupId: number): Observable<true> {
    if (!meetupId) return throwError(() => ({ error: { message: 'Invalid meetup ID.' } }));
    return this.http
      .post<ServiceResponse<boolean>>(`${this.base}/${meetupId}/join`, {})
      .pipe(
        map(res => {
          if (res?.success === false) {
            throw { error: { message: res.message ?? 'Failed to join meetup.' } };
          }
          return true as true;
        }),
        catchError(this.err),
      );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private err = (e: HttpErrorResponse | any): Observable<never> => {
    const msg =
      e?.error?.message
      ?? (Array.isArray(e?.error?.errors) ? e.error.errors[0] : null)
      ?? e?.message
      ?? 'An error occurred';
    console.error('[MeetupService]', e?.status ?? '', msg);
    return throwError(() => ({ error: { message: msg } }));
  };
}