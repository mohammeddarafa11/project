import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export type UserRole = 'user' | 'organizer';

export interface RegisterDto {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  message?: string;
  success?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://eventora.runasp.net/api';

  private authState = new BehaviorSubject<boolean>(false);
  public auth$ = this.authState.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  /** USER AUTH ENDPOINTS */
  registerUser(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/register`, data)
      .pipe(
        tap(res => this.setAuthData(res, 'user')),
        catchError(err => this.handleAuthError(err))
      );
  }

  loginUser(data: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/login`, data)
      .pipe(
        tap(res => this.setAuthData(res, 'user')),
        catchError(err => this.handleAuthError(err))
      );
  }

  forgotPasswordUser(data: ForgotPasswordDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/forgot-password`, data);
  }

  resetPasswordUser(data: ResetPasswordDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/reset-password`, data);
  }

  /** ORGANIZATION AUTH ENDPOINTS */
  registerOrganization(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/register`, data)
      .pipe(
        tap(res => this.setAuthData(res, 'organizer')),
        catchError(err => this.handleAuthError(err))
      );
  }

  loginOrganization(data: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/login`, data)
      .pipe(
        tap(res => this.setAuthData(res, 'organizer')),
        catchError(err => this.handleAuthError(err))
      );
  }

  forgotPasswordOrganization(data: ForgotPasswordDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/forgot-password`, data);
  }

  resetPasswordOrganization(data: ResetPasswordDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/reset-password`, data);
  }

  // Unified methods
  register(data: RegisterDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer' 
      ? this.registerOrganization(data) 
      : this.registerUser(data);
  }

  login(data: LoginDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer' 
      ? this.loginOrganization(data) 
      : this.loginUser(data);
  }

  forgotPassword(data: ForgotPasswordDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer' 
      ? this.forgotPasswordOrganization(data) 
      : this.forgotPasswordUser(data);
  }

  resetPassword(data: ResetPasswordDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer' 
      ? this.resetPasswordOrganization(data) 
      : this.resetPasswordUser(data);
  }

  setAuthData(response: AuthResponse, role: UserRole): void {
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_role', role);
      this.authState.next(true);
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    this.authState.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getRole(): UserRole | null {
    return localStorage.getItem('auth_role') as UserRole | null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private checkAuthStatus(): void {
    this.authState.next(this.isAuthenticated());
  }

  private handleAuthError(error: any): Observable<never> {
    const message = error?.error?.message || 'Authentication failed';
    return throwError(() => ({ error: { message } }));
  }
}
