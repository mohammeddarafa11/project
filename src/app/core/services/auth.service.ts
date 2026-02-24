// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'user' | 'organizer';

export interface Organization {
  id: number;
  name: string;
  email: string;
}

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
  data?:
    | {
        token?: string;
        refreshToken?: string;
        role?: string;
      }
    | string;
  success: boolean;
  message: string;
  errors?: string[];
  token?: string;
  refreshToken?: string;
}

interface JwtPayload {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  OrganizationName?: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://eventora.runasp.net/api';

  private authState = new BehaviorSubject<boolean>(false);
  public auth$ = this.authState.asObservable();

  private organizationState = new BehaviorSubject<Organization | null>(null);
  public organization$ = this.organizationState.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  // ========================================
  // REGISTRATION
  // ========================================
  register(data: RegisterDto, role: UserRole): Observable<AuthResponse> {
    const endpoint =
      role === 'organizer'
        ? `${this.baseUrl}/OrganizationAuth/register`
        : `${this.baseUrl}/Auth/register`;

    console.log(`📝 Registering ${role} at:`, endpoint);

    return this.http.post<AuthResponse>(endpoint, data).pipe(
      map((response) => {
        console.log(`✅ ${role} registration response:`, response);
        return response;
      }),
      catchError((err) => this.handleAuthError(err, 'Registration')),
    );
  }

  // ========================================
  // LOGIN
  // ========================================
  login(data: LoginDto, role: UserRole): Observable<AuthResponse> {
    const endpoint = `${this.baseUrl}/OrganizationAuth/login`;

    console.log(`🔐 Login attempt for ${role} at:`, endpoint);

    return this.http.post<AuthResponse>(endpoint, data).pipe(
      tap((response) => {
        if (response.success) {
          this.setAuthData(response, role);
        }
      }),
      catchError((err) => this.handleAuthError(err, 'Login')),
    );
  }

  // ========================================
  // FORGOT PASSWORD
  // ========================================
  forgotPassword(
    data: ForgotPasswordDto,
    role: UserRole,
  ): Observable<AuthResponse> {
    const endpoint = `${this.baseUrl}/OrganizationAuth/forgot-password`;

    return this.http
      .post<AuthResponse>(endpoint, data)
      .pipe(catchError((err) => this.handleAuthError(err, 'Forgot Password')));
  }

  // ========================================
  // RESET PASSWORD
  // ========================================
  resetPassword(
    data: ResetPasswordDto,
    role: UserRole,
  ): Observable<AuthResponse> {
    const endpoint = `${this.baseUrl}/OrganizationAuth/reset-password`;

    return this.http
      .post<AuthResponse>(endpoint, data)
      .pipe(catchError((err) => this.handleAuthError(err, 'Reset Password')));
  }

  // ========================================
  // TOKEN & ORGANIZATION MANAGEMENT
  // ========================================
  private setAuthData(response: AuthResponse, role: UserRole): void {
    const token =
      typeof response.data === 'string'
        ? response.data
        : response.data?.token || response.token;

    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_role', role);
      this.authState.next(true);

      this.extractOrganizationFromToken(token);

      console.log('✅ Auth token saved:', { role, tokenLength: token.length });
    } else {
      console.warn('⚠️ No token found in response:', response);
    }
  }

  private extractOrganizationFromToken(token: string): void {
    try {
      const decoded = jwtDecode<JwtPayload>(token);

      const org: Organization = {
        id: parseInt(
          decoded[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
          ],
        ),
        name: decoded['OrganizationName'] || 'Unknown Organization',
        email:
          decoded[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
          ],
      };

      this.organizationState.next(org);
      localStorage.setItem('organization', JSON.stringify(org));
      console.log('✅ Organization data extracted:', org);
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('organization');
    this.organizationState.next(null);
    this.authState.next(false);
    console.log('🚪 User logged out');
  }

  getToken(): string | null {
    
    return localStorage.getItem('auth_token');

  }

  getRole(): UserRole | null {
    return localStorage.getItem('auth_role') as UserRole | null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // ✅ Check if token is expired
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.warn('⚠️ Token expired, logging out');
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      this.logout();
      return false;
    }
  }

  isOrganizer(): boolean {
    return this.getRole() === 'organizer' && this.isAuthenticated();
  }

  // ✅ Get organization (cached or from token)
  getOrganization(): Organization | null {
    let org = this.organizationState.value;

    if (!org) {
      const stored = localStorage.getItem('organization');
      if (stored) {
        try {
          org = JSON.parse(stored);
          this.organizationState.next(org);
        } catch (e) {
          console.error('Failed to parse stored organization');
        }
      }
    }

    if (!org) {
      const token = this.getToken();
      if (token) {
        this.extractOrganizationFromToken(token);
        org = this.organizationState.value;
      }
    }

    return org;
  }

  private checkAuthStatus(): void {
    const isAuth = this.isAuthenticated();
    this.authState.next(isAuth);

    if (isAuth && this.getRole() === 'organizer') {
      const org = this.getOrganization();
      if (org) {
        console.log('✅ Organization restored:', org.name);
      } else {
        console.error('❌ Failed to restore organization - logging out');
        this.logout();
      }
    }
  }

  // ========================================
  // ERROR HANDLING
  // ========================================
  private handleAuthError(error: any, context: string): Observable<never> {
    console.error(`❌ ${context} Error:`, error);

    let message = `${context} failed`;

    if (error.status === 400) {
      message =
        error.error?.message ||
        error.error?.data?.message ||
        'Invalid credentials';
    } else if (error.status === 401) {
      message = 'Unauthorized. Please check your credentials.';
    } else if (error.status === 404) {
      message = 'Account not found. Please sign up first.';
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (error.error?.errors?.length) {
      message = error.error.errors.join(', ');
    } else if (typeof error.error === 'string') {
      message = error.error;
    }

    return throwError(() => ({ error: { message } }));
  }
}
