// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export type UserRole = 'user' | 'organizer';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrgRegisterDto {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  logoUrl?: string;
  coverUrl?: string;
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
  user?: any;
  message?: string;
  success?: boolean;
}

export interface AuthErrorResponse {
  title?: string;
  message?: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://eventora.runasp.net/api';

  private authState = new BehaviorSubject<boolean>(this.isAuthenticatedSync());
  public auth$ = this.authState.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    this.authState.next(this.isAuthenticatedSync());
  }

  private isAuthenticatedSync(): boolean {
    return !!this.getTokenSync();
  }

  private getTokenSync(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Register a new user (attendee)
   */
  registerUser(data: RegisterDto): Observable<AuthResponse> {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber || '',
      role: 'user',
      city: data.city || '',
      region: data.region || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
    };

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/Auth/register`, payload)
      .pipe(
        tap((res) => this.handleAuthSuccess(res, 'user')),
        catchError((err) => this.handleAuthError(err))
      );
  }

  /**
   * Register a new organization
   */
  registerOrganization(data: OrgRegisterDto): Observable<AuthResponse> {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber || '',
      city: data.city || '',
      region: data.region || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      bio: data.bio || '',
      logoUrl: data.logoUrl || '',
      coverUrl: data.coverUrl || '',
    };

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/register`, payload)
      .pipe(
        tap((res) => this.handleAuthSuccess(res, 'organizer')),
        catchError((err) => this.handleAuthError(err))
      );
  }

  /**
   * Unified register method
   */
  register(
    data: RegisterDto | OrgRegisterDto,
    role: UserRole
  ): Observable<AuthResponse> {
    return role === 'organizer'
      ? this.registerOrganization(data as OrgRegisterDto)
      : this.registerUser(data as RegisterDto);
  }

  /**
   * Login user (attendee)
   */
  loginUser(data: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/Auth/login`, data)
      .pipe(
        tap((res) => this.handleAuthSuccess(res, 'user')),
        catchError((err) => this.handleAuthError(err))
      );
  }

  /**
   * Login organization
   */
  loginOrganization(data: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/login`, data)
      .pipe(
        tap((res) => this.handleAuthSuccess(res, 'organizer')),
        catchError((err) => this.handleAuthError(err))
      );
  }

  /**
   * Unified login method
   */
  login(data: LoginDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer'
      ? this.loginOrganization(data)
      : this.loginUser(data);
  }

  /**
   * Forgot password for user
   */
  forgotPasswordUser(data: ForgotPasswordDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/Auth/forgot-password`, data)
      .pipe(catchError((err) => this.handleAuthError(err)));
  }

  /**
   * Forgot password for organization
   */
  forgotPasswordOrganization(
    data: ForgotPasswordDto
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/OrganizationAuth/forgot-password`,
        data
      )
      .pipe(catchError((err) => this.handleAuthError(err)));
  }

  /**
   * Unified forgot password method
   */
  forgotPassword(data: ForgotPasswordDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer'
      ? this.forgotPasswordOrganization(data)
      : this.forgotPasswordUser(data);
  }

  /**
   * Reset password for user
   */
  resetPasswordUser(data: ResetPasswordDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/Auth/reset-password`, data)
      .pipe(catchError((err) => this.handleAuthError(err)));
  }

  /**
   * Reset password for organization
   */
  resetPasswordOrganization(data: ResetPasswordDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/OrganizationAuth/reset-password`,
        data
      )
      .pipe(catchError((err) => this.handleAuthError(err)));
  }

  /**
   * Unified reset password method
   */
  resetPassword(data: ResetPasswordDto, role: UserRole): Observable<AuthResponse> {
    return role === 'organizer'
      ? this.resetPasswordOrganization(data)
      : this.resetPasswordUser(data);
  }

  /**
   * Store authentication data
   */
  setAuthData(response: AuthResponse, role: UserRole): void {
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_role', role);

      if (response.refreshToken) {
        localStorage.setItem('auth_refresh_token', response.refreshToken);
      }

      if (response.user) {
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

      this.authState.next(true);
    }
  }

  /**
   * Clear all authentication data
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    this.authState.next(false);
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSync();
  }

  /**
   * Get user role
   */
  getUserRole(): UserRole | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_role') as UserRole | null;
  }

  /**
   * Check if organizer
   */
  isOrganizer(): boolean {
    return this.getUserRole() === 'organizer';
  }

  /**
   * Check if user (attendee)
   */
  isUser(): boolean {
    return this.getUserRole() === 'user';
  }

  /**
   * Get token
   */
  getToken(): string | null {
    return this.getTokenSync();
  }

  /**
   * Get user data
   */
  getUser(): any {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  }

  private handleAuthSuccess(response: AuthResponse, role: UserRole): void {
    this.setAuthData(response, role);
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An authentication error occurred. Please try again.';

    if (error.error) {
      const errorBody = error.error as AuthErrorResponse;

      if (errorBody.title) {
        errorMessage = errorBody.title;
      } else if (errorBody.message) {
        errorMessage = errorBody.message;
      } else if (errorBody.detail) {
        errorMessage = errorBody.detail;
      } else if (errorBody.errors && typeof errorBody.errors === 'object') {
        const messages = Object.values(errorBody.errors)
          .flat()
          .join(', ');
        if (messages) {
          errorMessage = messages;
        }
      }
    } else if (error.status === 401) {
      errorMessage = 'Invalid email or password.';
    } else if (error.status === 409) {
      errorMessage = 'This email is already registered. Please login instead.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid input. Please check your information.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Check your connection.';
    }

    return throwError(() => ({
      error: { message: errorMessage, title: errorMessage },
      status: error.status,
    }));
  }
}
