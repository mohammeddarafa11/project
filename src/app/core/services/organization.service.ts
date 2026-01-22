// src/app/core/services/organization.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Organization {
  id: number;
  name: string;
  email: string;
  // Add other organization fields as needed
}

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errors: string[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly baseURL = 'https://eventora.runasp.net/api/Organization';
  private currentOrganization$ = new BehaviorSubject<Organization | null>(null);

  constructor(private http: HttpClient) {}

  // Get current authenticated organization profile
  getCurrentOrganization(): Observable<Organization> {
    return this.http
      .get<ServiceResponse<Organization>>(`${this.baseURL}/profile`)
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error(
            response.message || 'Failed to fetch organization profile',
          );
        }),
        tap((org) => this.currentOrganization$.next(org)),
        catchError(this.handleError),
      );
  }

  // Get cached organization (synchronous)
  getCachedOrganization(): Organization | null {
    return this.currentOrganization$.value;
  }

  // Observable of current organization
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
