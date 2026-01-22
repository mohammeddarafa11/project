// src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Category {
  id: number;
  name: string;
  userCategories?: any[];
  organizationCategories?: any[];
  events?: any[];
  meetups?: any[];
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
export class CategoryService {
  private readonly baseURL = 'https://eventora.runasp.net/api/Category';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http.get<ServiceResponse<Category[]>>(this.baseURL).pipe(
      map((response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch categories');
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
