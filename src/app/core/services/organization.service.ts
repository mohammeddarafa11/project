// src/app/core/services/organization.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Organization {
  id: number;
  name: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  region?: string | null;
  bio?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phoneNumber?: string | null;
  status?: number;
  officialContract?: string | null;
}

export interface UpdateOrganizationDto {
  name?: string | null;
  city?: string | null;
  region?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errors: string[] | null;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly baseURL = 'https://eventora.runasp.net/api/Organization';
  private currentOrganization$ = new BehaviorSubject<Organization | null>(null);

  constructor(private http: HttpClient) {}

  /** GET /api/Organization/all */
  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<ServiceResponse<Organization[]>>(`${this.baseURL}/all`).pipe(
      map(r => {
        if (r.success) return r.data ?? [];
        throw new Error(r.message || 'Failed to fetch organizations');
      }),
      catchError(this.handleError),
    );
  }

  /** GET /api/Organization/{organizationId} */
  getOrganizationById(organizationId: number): Observable<Organization> {
    return this.http.get<ServiceResponse<Organization>>(`${this.baseURL}/${organizationId}`).pipe(
      map(r => {
        if (r.success) return r.data;
        throw new Error(r.message || 'Failed to fetch organization');
      }),
      tap(org => this.currentOrganization$.next(org)),
      catchError(this.handleError),
    );
  }

  /** PUT /api/Organization/{organizationId} */
  updateOrganization(organizationId: number, dto: UpdateOrganizationDto): Observable<void> {
    return this.http.put<void>(`${this.baseURL}/${organizationId}`, dto).pipe(
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  // ── Cache helpers ─────────────────────────────────────────────────────────

  getCachedOrganization(): Organization | null {
    return this.currentOrganization$.value;
  }

  get organization$(): Observable<Organization | null> {
    return this.currentOrganization$.asObservable();
  }

  clearOrganization(): void {
    this.currentOrganization$.next(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message
        || error.error?.errors?.join(', ')
        || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}