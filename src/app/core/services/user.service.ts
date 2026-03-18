// src/app/core/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Category {
  id: number;
  name: string | null;
}

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errors: string[] | null;
}

export interface UserProfile {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  region?: string | null;
  street?: string | null;
  role?: string | null;
  isVerified?: boolean;
}

export interface UpdateUserDto {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  region?: string | null;
  street?: string | null;
}

export interface UserBooking {
  id: number;
  ticketUniqueCode: string;
  isUsed: boolean;
  usedAt?: string;
  purchaseDate: string;
  eventTicket?: {
    id: number;
    actualPrice: number;
    event?: {
      id: number;
      title: string;
      start_time: string;
      event_img_url?: string;
      city?: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = 'https://eventora.runasp.net/api';

  private _user$ = new BehaviorSubject<UserProfile | null>(null);
  private _favorites$ = new BehaviorSubject<Category[]>([]);

  get user$(): Observable<UserProfile | null> { return this._user$.asObservable(); }
  get favorites$(): Observable<Category[]> { return this._favorites$.asObservable(); }

  // ── Profile ───────────────────────────────────────────────────────────────

  /** GET /api/User */
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<ServiceResponse<UserProfile>>(`${this.baseUrl}/User`).pipe(
      map(r => {
        if (r.success) return r.data;
        throw new Error(r.message || 'Failed to fetch user profile');
      }),
      tap(user => this._user$.next(user)),
      catchError(this.handleError),
    );
  }

  /** PUT /api/User/{id} */
  updateUser(id: number, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/User/${id}`, dto).pipe(
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  getCachedUser(): UserProfile | null { return this._user$.value; }

  clearUser(): void { this._user$.next(null); }

  // ── Favorites ─────────────────────────────────────────────────────────────

  /** GET /api/User/favorites */
  getFavorites(): Observable<Category[]> {
    return this.http.get<ServiceResponse<Category[]>>(`${this.baseUrl}/User/favorites`).pipe(
      map(r => r.success ? (r.data ?? []) : []),
      tap(cats => this._favorites$.next(cats)),
      catchError(this.handleError),
    );
  }

  /** POST /api/User/add-favorites */
  addFavorites(categoryIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/User/add-favorites`, categoryIds).pipe(
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  /** DELETE /api/User/remove-favorite/{categoryId} */
  removeFavorite(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/User/remove-favorite/${categoryId}`).pipe(
      map(() => undefined),
      tap(() => this._favorites$.next(this._favorites$.value.filter(c => c.id !== categoryId))),
      catchError(this.handleError),
    );
  }

  // ── Follow ────────────────────────────────────────────────────────────────

  /** POST /api/User/toggle-follow/{organizationId} */
  toggleFollow(organizationId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/User/toggle-follow/${organizationId}`, {}).pipe(
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  /** GET /api/Ticket/MyBookings */
  getMyBookings(): Observable<UserBooking[]> {
    return this.http.get<ServiceResponse<UserBooking[]>>(`${this.baseUrl}/Ticket/MyBookings`).pipe(
      map(r => r.success ? (r.data ?? []) : []),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else {
      message = error.error?.message
        || error.error?.errors?.join(', ')
        || `Error ${error.status}: ${error.message}`;
    }
    console.error('[UserService]', message);
    return throwError(() => new Error(message));
  }
}