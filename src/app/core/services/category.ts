// src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Category {
  id: number;
  name: string;
}

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errors: string[] | null;
}

export interface AddCategoryDto    { name: string; }
export interface UpdateCategoryDto { name: string; }

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly baseURL = 'https://eventora.runasp.net/api/Category';

  constructor(private http: HttpClient) {}

  /** GET /api/Category */
  getAllCategories(): Observable<Category[]> {
    return this.http.get<ServiceResponse<Category[]>>(this.baseURL).pipe(
      map(r => {
        if (r.success) return r.data ?? [];
        throw new Error(r.message || 'Failed to fetch categories');
      }),
      catchError(this.handleError),
    );
  }

  /** GET /api/Category/{id} */
  getCategoryById(id: number): Observable<Category> {
    return this.http.get<ServiceResponse<Category>>(`${this.baseURL}/${id}`).pipe(
      map(r => {
        if (r.success) return r.data;
        throw new Error(r.message || 'Failed to fetch category');
      }),
      catchError(this.handleError),
    );
  }

  /** POST /api/Category */
  createCategory(dto: AddCategoryDto): Observable<Category> {
    return this.http.post<ServiceResponse<Category>>(this.baseURL, dto).pipe(
      map(r => {
        if (r.success) return r.data;
        throw new Error(r.message || 'Failed to create category');
      }),
      catchError(this.handleError),
    );
  }

  /** PUT /api/Category/{id} */
  updateCategory(id: number, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.put<ServiceResponse<Category>>(`${this.baseURL}/${id}`, dto).pipe(
      map(r => {
        if (r.success) return r.data;
        throw new Error(r.message || 'Failed to update category');
      }),
      catchError(this.handleError),
    );
  }

  /** DELETE /api/Category/{id} */
  deleteCategory(id: number): Observable<boolean> {
    return this.http.delete<ServiceResponse<boolean>>(`${this.baseURL}/${id}`).pipe(
      map(r => r.data),
      catchError(this.handleError),
    );
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