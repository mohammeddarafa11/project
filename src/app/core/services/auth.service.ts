// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'user' | 'organizer';

export interface AuthIdentity {
  id: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  /** Alias for organizationName — used by sidebar & dashboard components */
  name: string;
}

export interface RegisterDto {
  firstName?: string; lastName?: string; name?: string;
  email: string; password: string; phoneNumber?: string;
  city?: string; region?: string;
  role?: string;
}

export interface OrgRegisterDto {
  name: string; email: string; password: string;
  officialContract?: string | null; phoneNumber?: string | null;
  city?: string | null; region?: string | null;
  latitude?: number | null; longitude?: number | null;
  bio?: string | null; logoUrl?: string | null; coverUrl?: string | null;
}

export interface VerifyAccountDto { email: string; code: string; }
export interface LoginDto { email: string; password: string; }
export interface ForgotPasswordDto { email: string; }
export interface ResetPasswordDto { email: string; token: string; newPassword: string; }

export interface AuthResponse {
  data?: { token?: string; refreshToken?: string; role?: string } | string;
  success: boolean; message: string; errors?: string[]; token?: string;
}

// ─── JWT claim URIs ───────────────────────────────────────────────────────────
const CLAIM_ID      = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_EMAIL   = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_ROLE    = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const CLAIM_GIVEN   = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname';
const CLAIM_SURNAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'https://eventora.runasp.net/api';

  // ── State ─────────────────────────────────────────────────────────────────
  private readonly _identity$ = new BehaviorSubject<AuthIdentity | null>(null);
  readonly identity$ = this._identity$.asObservable();

  // Keep these for backwards-compat with existing components
  public auth$         = this._identity$.pipe();
  public organization$ = new BehaviorSubject<AuthIdentity | null>(null).asObservable();

  constructor() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !this.isExpired(token)) {
      this._identity$.next(this.decode(token));
    } else if (token) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  register(data: RegisterDto, role: UserRole): Observable<AuthResponse> {
    const endpoint = role === 'organizer'
      ? `${this.baseUrl}/OrganizationAuth/register`
      : `${this.baseUrl}/Auth/register`;
    const payload = role === 'user' ? { ...data, role: 'User' } : data;
    return this.http.post<AuthResponse>(endpoint, payload).pipe(
      catchError(err => this.handleAuthError(err, 'Registration')),
    );
  }

  registerOrganization(dto: OrgRegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/OrganizationAuth/register`, dto).pipe(
      catchError(err => this.handleAuthError(err, 'Registration')),
    );
  }

  // ─── Verify ───────────────────────────────────────────────────────────────

  verifyAccount(dto: VerifyAccountDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/verify`, dto).pipe(
      catchError(err => this.handleAuthError(err, 'Verification')),
    );
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  login(data: LoginDto, role: UserRole): Observable<AuthResponse> {
    const endpoint = role === 'organizer'
      ? `${this.baseUrl}/OrganizationAuth/login`
      : `${this.baseUrl}/Auth/login`;
    return this.http.post<AuthResponse>(endpoint, data).pipe(
      tap(r => { if (r.success) this.handleTokenResponse(r, role); }),
      catchError(err => this.handleAuthError(err, 'Login')),
    );
  }

  // ─── Forgot / Reset ───────────────────────────────────────────────────────

  forgotPassword(data: ForgotPasswordDto, role: UserRole): Observable<AuthResponse> {
    const ep = role === 'organizer'
      ? `${this.baseUrl}/OrganizationAuth/forgot-password`
      : `${this.baseUrl}/Auth/forgot-password`;
    return this.http.post<AuthResponse>(ep, data).pipe(
      catchError(e => this.handleAuthError(e, 'Forgot')),
    );
  }

  resetPassword(data: ResetPasswordDto, role: UserRole): Observable<AuthResponse> {
    const ep = role === 'organizer'
      ? `${this.baseUrl}/OrganizationAuth/reset-password`
      : `${this.baseUrl}/Auth/reset-password`;
    return this.http.post<AuthResponse>(ep, data).pipe(
      catchError(e => this.handleAuthError(e, 'Reset')),
    );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  logout(): void {
    this.http.post(`${this.baseUrl}/Auth/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem(TOKEN_KEY);
    this._identity$.next(null);
    this.router.navigate(['/']);
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isExpired(token);
  }

  isOrganizer(): boolean { return this._identity$.value?.role === 'organizer'; }
  isUser():      boolean { return this._identity$.value?.role === 'user'; }

  getIdentity(): AuthIdentity | null { return this._identity$.value; }

  /** @deprecated use getIdentity() */
  getOrganization(): AuthIdentity | null { return this.getIdentity(); }

  /** @deprecated use getIdentity() */
  getUserProfile(): AuthIdentity | null { return this.getIdentity(); }

  getDashboardRoute(): string {
    return this.isOrganizer() ? '/dashboard' : '/user-dashboard';
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private handleTokenResponse(res: AuthResponse, role: UserRole): void {
    const token = this.extractToken(res);
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    this._identity$.next(this.decode(token, role));
  }

  private extractToken(res: AuthResponse): string | null {
    if (!res.success) return null;
    if (typeof res.data === 'string' && res.data.startsWith('eyJ')) return res.data;
    if (res.data && typeof res.data === 'object') {
      const obj = res.data as Record<string, unknown>;
      const t = obj['token'] ?? obj['accessToken'] ?? obj['jwt'];
      if (typeof t === 'string') return t;
    }
    if (typeof res.token === 'string') return res.token;
    return null;
  }

  // ─── Category ID cache helpers (used by category-select & dashboard) ─────

  getSavedCategoryIds(): number[] {
    try { const s = localStorage.getItem('user_categories'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  }

  saveCategoryIds(ids: number[]): void {
    localStorage.setItem('user_categories', JSON.stringify(ids));
  }

  private decode(token: string, fallbackRole?: UserRole): AuthIdentity {
    const payload = jwtDecode<Record<string, unknown>>(token);
    const roleRaw = (payload[CLAIM_ROLE] as string | undefined)?.toLowerCase() ?? fallbackRole ?? 'user';
    const role: UserRole = roleRaw === 'organization' || roleRaw === 'organizer' ? 'organizer' : 'user';
    const organizationName = payload['OrganizationName'] as string | undefined;
    return {
      id:               parseInt(payload[CLAIM_ID] as string, 10),
      email:            payload[CLAIM_EMAIL] as string,
      role,
      firstName:        (payload['FirstName'] as string | undefined) ?? (payload[CLAIM_GIVEN] as string | undefined),
      lastName:         (payload['LastName']  as string | undefined) ?? (payload[CLAIM_SURNAME] as string | undefined),
      organizationName,
      name:             organizationName ?? '', // always a string — used by sidebar & dashboard
    };
  }

  private isExpired(token: string): boolean {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return Date.now() / 1000 >= exp;
    } catch { return true; }
  }

  private handleAuthError(error: any, ctx: string): Observable<never> {
    let message = `${ctx} failed`;
    if      (error.status === 400) message = error.error?.message || error.error?.errors?.[0] || 'Invalid data';
    else if (error.status === 401) message = 'Unauthorized. Check your credentials.';
    else if (error.status === 404) message = 'Account not found. Please sign up first.';
    else if (error.error?.message)          message = error.error.message;
    else if (error.error?.errors?.length)   message = error.error.errors.join(', ');
    else if (typeof error.error === 'string') message = error.error;
    return throwError(() => ({ error: { message } }));
  }
}