// src/app/features/auth/auth-dialog/auth-dialog.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ZardDialogRef } from '@shared/components/dialog/dialog-ref';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import {
  AuthService,
  UserRole,
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@core/services/auth.service';

type DialogStep =
  | 'welcome'
  | 'role-selection'
  | 'register'
  | 'login'
  | 'forgot-password'
  | 'reset-password';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardDividerComponent,
    ZardInputDirective,
    ZardIconComponent,
  ],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

    <div class="es-auth">

      <!-- Ambient glow -->
      <div class="es-auth__glow" aria-hidden="true"></div>
      <div class="es-auth__noise" aria-hidden="true"></div>

      <!-- ══════════ WELCOME ══════════ -->
      @if (step() === 'welcome') {
        <div class="es-auth__pane es-anim-in">

          <!-- Logo mark -->
          <div class="es-auth__brand">
            <div class="es-auth__logo-ring">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 10h12M8 14h8M8 18h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="es-auth__logo-name">Eventsora</span>
          </div>

          <div class="es-auth__head">
            <h2 class="es-auth__title">Get Started</h2>
            <p class="es-auth__sub">Create your account or log in to start building amazing events in Egypt.</p>
          </div>

          <div class="es-auth__actions">
            <button class="es-btn-primary" (click)="goToRoleSelection()">
              <span>Sign Up</span>
              <span class="es-btn-primary__icon">
                <z-icon [zType]="icons.userPlus" class="es-icon" />
              </span>
            </button>
            <button class="es-btn-ghost" (click)="goToLogin()">
              <z-icon [zType]="icons.logIn" class="es-icon-sm" />
              Organizer Login
            </button>
          </div>

        </div>
      }

      <!-- ══════════ ROLE SELECTION ══════════ -->
      @if (step() === 'role-selection') {
        <div class="es-auth__pane es-anim-in">

          <button class="es-back-btn" (click)="backToWelcome()">
            <z-icon [zType]="icons.arrowLeft" class="es-icon-sm" />
            Back
          </button>

          <div class="es-auth__head">
            <h2 class="es-auth__title">Choose Your Role</h2>
            <p class="es-auth__sub">How do you want to use Eventsora?</p>
          </div>

          <div class="es-role-grid">
            <!-- Organizer -->
            <div class="es-role-card"
                 [class.es-role-card--active]="selectedRole() === 'organizer'"
                 (click)="selectRole('organizer')">
              <div class="es-role-card__check" [class.es-role-card__check--on]="selectedRole() === 'organizer'">
                <z-icon [zType]="icons.checkCircle" class="es-icon-sm" />
              </div>
              <div class="es-role-card__icon">
                <z-icon [zType]="icons.briefcase" class="es-icon-lg" />
              </div>
              <h3 class="es-role-card__title">Organizer</h3>
              <p class="es-role-card__desc">Create & manage events</p>
            </div>

            <!-- Attendee -->
            <div class="es-role-card"
                 [class.es-role-card--active]="selectedRole() === 'user'"
                 (click)="selectRole('user')">
              <div class="es-role-card__check" [class.es-role-card__check--on]="selectedRole() === 'user'">
                <z-icon [zType]="icons.checkCircle" class="es-icon-sm" />
              </div>
              <div class="es-role-card__icon">
                <z-icon [zType]="icons.user" class="es-icon-lg" />
              </div>
              <h3 class="es-role-card__title">Attendee</h3>
              <p class="es-role-card__desc">Discover & join events</p>
            </div>
          </div>

          <div class="es-auth__alt-link">
            Already have an account?
            <button class="es-link" (click)="goToLogin()">Login</button>
          </div>

        </div>
      }

      <!-- ══════════ REGISTER ══════════ -->
      @if (step() === 'register') {
        <div class="es-auth__pane es-anim-in">

          <button class="es-back-btn" (click)="backToRoleSelection()">
            <z-icon [zType]="icons.arrowLeft" class="es-icon-sm" />
            Back
          </button>

          <div class="es-auth__head">
            <div class="es-auth__role-badge">
              <z-icon [zType]="selectedRole() === 'organizer' ? icons.briefcase : icons.user" class="es-icon-sm" />
              {{ selectedRole() === 'organizer' ? 'Organizer' : 'Attendee' }}
            </div>
            <h2 class="es-auth__title">Create Account</h2>
            <p class="es-auth__sub">Join Egypt's premier events platform</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="es-form">

            @if (selectedRole() === 'organizer') {
              <div class="es-field">
                <label class="es-label">Organization Name <span class="es-required">*</span></label>
                <input z-input formControlName="name" type="text"
                       placeholder="Your organization name"
                       class="es-input" />
                @if (registerForm.get('name')?.invalid && registerForm.get('name')?.touched) {
                  <p class="es-field-error">Organization name is required</p>
                }
              </div>
            } @else {
              <div class="es-field-row">
                <div class="es-field">
                  <label class="es-label">First Name <span class="es-required">*</span></label>
                  <input z-input formControlName="firstName" type="text"
                         placeholder="First name" class="es-input" />
                  @if (registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched) {
                    <p class="es-field-error">Required</p>
                  }
                </div>
                <div class="es-field">
                  <label class="es-label">Last Name <span class="es-required">*</span></label>
                  <input z-input formControlName="lastName" type="text"
                         placeholder="Last name" class="es-input" />
                  @if (registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched) {
                    <p class="es-field-error">Required</p>
                  }
                </div>
              </div>
            }

            <div class="es-field">
              <label class="es-label">Email <span class="es-required">*</span></label>
              <input z-input formControlName="email" type="email"
                     placeholder="you@example.com" class="es-input" />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <p class="es-field-error">Valid email is required</p>
              }
            </div>

            <div class="es-field">
              <label class="es-label">Password <span class="es-required">*</span></label>
              <input z-input formControlName="password" type="password"
                     placeholder="Min. 6 characters" class="es-input" />
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <p class="es-field-error">Password must be at least 6 characters</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="es-alert es-alert--error">
                <z-icon [zType]="icons.alertCircle" class="es-icon-sm" />
                {{ errorMessage() }}
              </div>
            }
            @if (successMessage()) {
              <div class="es-alert es-alert--success">
                <z-icon [zType]="icons.checkCircle" class="es-icon-sm" />
                {{ successMessage() }}
              </div>
            }

            <button class="es-btn-primary" type="submit"
                    [disabled]="registerForm.invalid || isSubmitting()">
              @if (isSubmitting()) {
                <z-icon [zType]="icons.loader" class="es-icon-sm es-spin" />
                Creating Account…
              } @else {
                <span>Create Account</span>
                <span class="es-btn-primary__icon">
                  <z-icon [zType]="icons.userPlus" class="es-icon" />
                </span>
              }
            </button>

          </form>

          <div class="es-auth__alt-link">
            Already have an account?
            <button class="es-link" (click)="goToLogin()">Login</button>
          </div>

        </div>
      }

      <!-- ══════════ LOGIN ══════════ -->
      @if (step() === 'login') {
        <div class="es-auth__pane es-anim-in">

          <button class="es-back-btn" (click)="backToWelcome()">
            <z-icon [zType]="icons.arrowLeft" class="es-icon-sm" />
            Back
          </button>

          <div class="es-auth__head">
            <div class="es-auth__role-badge">
              <z-icon [zType]="icons.briefcase" class="es-icon-sm" />
              Organizer
            </div>
            <h2 class="es-auth__title">Welcome Back</h2>
            <p class="es-auth__sub">Log in to manage your events dashboard</p>
          </div>

          <!-- Info strip -->
          <div class="es-info-strip">
            <z-icon [zType]="icons.alertCircle" class="es-icon-sm es-info-strip__icon" />
            <span>Only organizers can log in. Attendees can browse without an account.</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="es-form">

            <div class="es-field">
              <label class="es-label">Email</label>
              <input z-input formControlName="email" type="email"
                     placeholder="you@organization.com" class="es-input" />
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <p class="es-field-error">Valid email is required</p>
              }
            </div>

            <div class="es-field">
              <div class="es-label-row">
                <label class="es-label">Password</label>
                <button type="button" class="es-link es-link--sm" (click)="goToForgotPassword()">
                  Forgot password?
                </button>
              </div>
              <input z-input formControlName="password" type="password"
                     placeholder="Your password" class="es-input" />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <p class="es-field-error">Password is required</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="es-alert es-alert--error">
                <z-icon [zType]="icons.alertCircle" class="es-icon-sm" />
                {{ errorMessage() }}
              </div>
            }
            @if (successMessage()) {
              <div class="es-alert es-alert--success">
                <z-icon [zType]="icons.checkCircle" class="es-icon-sm" />
                {{ successMessage() }}
              </div>
            }

            <button class="es-btn-primary" type="submit"
                    [disabled]="loginForm.invalid || isSubmitting()">
              @if (isSubmitting()) {
                <z-icon [zType]="icons.loader" class="es-icon-sm es-spin" />
                Logging in…
              } @else {
                <span>Login as Organizer</span>
                <span class="es-btn-primary__icon">
                  <z-icon [zType]="icons.logIn" class="es-icon" />
                </span>
              }
            </button>

          </form>

          <div class="es-auth__alt-link">
            Don't have an organizer account?
            <button class="es-link" (click)="goToRoleSelection()">Sign up</button>
          </div>

        </div>
      }

      <!-- ══════════ FORGOT PASSWORD ══════════ -->
      @if (step() === 'forgot-password') {
        <div class="es-auth__pane es-anim-in">

          <button class="es-back-btn" (click)="backToLogin()">
            <z-icon [zType]="icons.arrowLeft" class="es-icon-sm" />
            Back
          </button>

          <div class="es-auth__head">
            <div class="es-auth__logo-ring es-auth__logo-ring--gold">
              <z-icon [zType]="icons.mail" class="es-icon-lg" />
            </div>
            <h2 class="es-auth__title">Forgot Password</h2>
            <p class="es-auth__sub">Enter your email and we'll send reset instructions</p>
          </div>

          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onForgotPassword()" class="es-form">

            <div class="es-field">
              <label class="es-label">Email</label>
              <input z-input formControlName="email" type="email"
                     placeholder="you@organization.com" class="es-input" />
              @if (forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched) {
                <p class="es-field-error">Valid email is required</p>
              }
            </div>

            @if (errorMessage()) {
              <div class="es-alert es-alert--error">
                <z-icon [zType]="icons.alertCircle" class="es-icon-sm" />
                {{ errorMessage() }}
              </div>
            }
            @if (successMessage()) {
              <div class="es-alert es-alert--success">
                <z-icon [zType]="icons.checkCircle" class="es-icon-sm" />
                {{ successMessage() }}
              </div>
            }

            <button class="es-btn-primary" type="submit"
                    [disabled]="forgotPasswordForm.invalid || isSubmitting()">
              @if (isSubmitting()) {
                <z-icon [zType]="icons.loader" class="es-icon-sm es-spin" />
                Sending…
              } @else {
                <span>Send Reset Link</span>
                <span class="es-btn-primary__icon">
                  <z-icon [zType]="icons.mail" class="es-icon" />
                </span>
              }
            </button>

          </form>

        </div>
      }

      <!-- ══════════ RESET PASSWORD ══════════ -->
      @if (step() === 'reset-password') {
        <div class="es-auth__pane es-anim-in">

          <button class="es-back-btn" (click)="backToLogin()">
            <z-icon [zType]="icons.arrowLeft" class="es-icon-sm" />
            Back
          </button>

          <div class="es-auth__head">
            <div class="es-auth__logo-ring es-auth__logo-ring--coral">
              <z-icon [zType]="icons.key" class="es-icon-lg" />
            </div>
            <h2 class="es-auth__title">Reset Password</h2>
            <p class="es-auth__sub">Enter the token from your email and your new password</p>
          </div>

          <form [formGroup]="resetPasswordForm" (ngSubmit)="onResetPassword()" class="es-form">

            <div class="es-field">
              <label class="es-label">Email</label>
              <input z-input formControlName="email" type="email"
                     placeholder="you@organization.com" class="es-input" />
            </div>

            <div class="es-field">
              <label class="es-label">Reset Token</label>
              <input z-input formControlName="token" type="text"
                     placeholder="Token from your email" class="es-input es-input--mono" />
            </div>

            <div class="es-field">
              <label class="es-label">New Password</label>
              <input z-input formControlName="newPassword" type="password"
                     placeholder="Min. 6 characters" class="es-input" />
            </div>

            @if (errorMessage()) {
              <div class="es-alert es-alert--error">
                <z-icon [zType]="icons.alertCircle" class="es-icon-sm" />
                {{ errorMessage() }}
              </div>
            }
            @if (successMessage()) {
              <div class="es-alert es-alert--success">
                <z-icon [zType]="icons.checkCircle" class="es-icon-sm" />
                {{ successMessage() }}
              </div>
            }

            <button class="es-btn-primary" type="submit"
                    [disabled]="resetPasswordForm.invalid || isSubmitting()">
              @if (isSubmitting()) {
                <z-icon [zType]="icons.loader" class="es-icon-sm es-spin" />
                Resetting…
              } @else {
                <span>Reset Password</span>
                <span class="es-btn-primary__icon">
                  <z-icon [zType]="icons.key" class="es-icon" />
                </span>
              }
            </button>

          </form>

        </div>
      }

    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       TOKENS
    ═══════════════════════════════════════════ */
    :host {
      --bg:        #09090c;
      --bg2:       #111116;
      --coral:     #FF4433;
      --coral-dim: rgba(255,68,51,0.1);
      --gold:      #F0B429;
      --gold-dim:  rgba(240,180,41,0.1);
      --text:      #F2EEE6;
      --muted:     rgba(242,238,230,0.45);
      --border:    rgba(242,238,230,0.08);
      --border-hi: rgba(242,238,230,0.14);
      --fd: 'Bebas Neue', sans-serif;
      --fb: 'Plus Jakarta Sans', sans-serif;
      --fm: 'DM Mono', monospace;
      display: block;
      /* fill the dialog on any screen size */
      width: 100%;
    }

    /* ═══════════════════════════════════════════
       WRAPPER  — mobile-first: full width, no min-width
    ═══════════════════════════════════════════ */
    .es-auth {
      position: relative;
      width: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--fb);
      overflow: hidden;
    }

    /* ambient glow */
    .es-auth__glow {
      position: absolute;
      top: -40%; left: -30%;
      width: 260px; height: 260px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,68,51,.07) 0%, transparent 65%);
      pointer-events: none; z-index: 0;
    }

    /* noise */
    .es-auth__noise {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      background-size: 256px; mix-blend-mode: overlay; opacity: .8;
      pointer-events: none; z-index: 0;
    }

    /* ═══════════════════════════════════════════
       PANE  — tighter padding on small screens
    ═══════════════════════════════════════════ */
    .es-auth__pane {
      position: relative; z-index: 1;
      /* mobile: compact padding */
      padding: 1.25rem 1rem 1.5rem;
      display: flex; flex-direction: column; gap: 1.1rem;
    }

    /* entrance animation */
    .es-anim-in {
      animation: pane-in .35s cubic-bezier(.2,.8,.4,1) both;
    }
    @keyframes pane-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ═══════════════════════════════════════════
       BRAND
    ═══════════════════════════════════════════ */
    .es-auth__brand {
      display: flex; align-items: center; gap: 8px;
    }
    .es-auth__logo-ring {
      width: 36px; height: 36px;
      border: 1px solid rgba(255,68,51,.4);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: var(--coral);
      background: var(--coral-dim);
      flex-shrink: 0;
    }
    .es-auth__logo-ring--gold {
      border-color: rgba(240,180,41,.4);
      color: var(--gold);
      background: var(--gold-dim);
    }
    .es-auth__logo-ring--coral {
      border-color: rgba(255,68,51,.4);
      color: var(--coral);
      background: var(--coral-dim);
    }
    .es-auth__logo-name {
      font-family: var(--fd);
      font-size: 1.35rem;
      letter-spacing: .06em;
      color: var(--text);
    }

    /* ═══════════════════════════════════════════
       HEAD
    ═══════════════════════════════════════════ */
    .es-auth__head {
      display: flex; flex-direction: column; gap: .4rem;
    }
    .es-auth__title {
      font-family: var(--fd);
      /* mobile: slightly smaller */
      font-size: 1.9rem;
      letter-spacing: .04em;
      color: var(--text);
      margin: 0;
      line-height: 1;
    }
    .es-auth__sub {
      font-size: .84rem;
      color: var(--muted);
      line-height: 1.6;
      margin: 0;
      font-weight: 300;
    }
    .es-auth__role-badge {
      display: inline-flex; align-items: center; gap: 6px;
      width: fit-content;
      padding: 3px 10px;
      background: var(--coral-dim);
      border: 1px solid rgba(255,68,51,.25);
      border-radius: 100px;
      font-family: var(--fm);
      font-size: .62rem;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--coral);
    }

    /* ═══════════════════════════════════════════
       ACTIONS (welcome)
    ═══════════════════════════════════════════ */
    .es-auth__actions {
      display: flex; flex-direction: column; gap: .65rem;
    }

    /* ═══════════════════════════════════════════
       BUTTONS
    ═══════════════════════════════════════════ */
    .es-btn-primary {
      width: 100%;
      display: inline-flex; align-items: center; justify-content: space-between;
      /* mobile: slightly less padding */
      padding: .75rem 1rem .75rem 1.2rem;
      background: var(--coral); color: #fff;
      border: none; border-radius: 11px;
      font-family: var(--fb); font-weight: 700; font-size: .88rem;
      letter-spacing: .02em;
      cursor: pointer;
      transition: box-shadow .25s, transform .18s, opacity .2s;
      box-shadow: 0 0 24px rgba(255,68,51,.22);
      position: relative; overflow: hidden;
      /* prevent tap highlight on mobile */
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .es-btn-primary::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.13) 0%, transparent 55%);
      pointer-events: none;
    }
    .es-btn-primary:hover:not(:disabled) {
      box-shadow: 0 0 44px rgba(255,68,51,.42);
      transform: translateY(-1px);
    }
    .es-btn-primary:active:not(:disabled) {
      transform: translateY(0) scale(.98);
    }
    .es-btn-primary:disabled { opacity: .45; cursor: not-allowed; transform: none; }
    .es-btn-primary__icon {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px;
      background: rgba(255,255,255,.18); border-radius: 7px;
      font-size: .8rem; flex-shrink: 0;
      transition: transform .2s;
    }
    .es-btn-primary:hover:not(:disabled) .es-btn-primary__icon { transform: rotate(15deg); }

    /* ghost */
    .es-btn-ghost {
      width: 100%;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: .75rem 1.2rem;
      background: transparent; color: var(--text);
      border: 1px solid var(--border-hi); border-radius: 11px;
      font-family: var(--fb); font-weight: 500; font-size: .88rem;
      cursor: pointer;
      transition: border-color .22s, background .22s, color .22s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .es-btn-ghost:hover {
      border-color: rgba(255,68,51,.35);
      background: var(--coral-dim);
      color: #ff7060;
    }
    .es-btn-ghost:active { background: rgba(255,68,51,.15); }

    /* back btn */
    .es-back-btn {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: none; padding: 0;
      font-family: var(--fb); font-size: .78rem; font-weight: 500;
      color: var(--muted); cursor: pointer;
      transition: color .2s; width: fit-content;
      /* larger tap target on mobile */
      min-height: 36px;
      -webkit-tap-highlight-color: transparent;
    }
    .es-back-btn:hover { color: var(--text); }

    /* link */
    .es-link {
      background: none; border: none; padding: 0;
      font-family: var(--fb); font-size: inherit; font-weight: 600;
      color: var(--coral); cursor: pointer;
      transition: opacity .2s;
      -webkit-tap-highlight-color: transparent;
    }
    .es-link:hover { opacity: .8; }
    .es-link--sm { font-size: .78rem; font-weight: 500; }

    /* ═══════════════════════════════════════════
       ROLE CARDS  — stacked on mobile, 2-col on sm+
    ═══════════════════════════════════════════ */
    .es-role-grid {
      display: grid;
      /* mobile: full-width stack */
      grid-template-columns: 1fr;
      gap: .75rem;
    }
    .es-role-card {
      position: relative;
      padding: 1rem .9rem;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 13px;
      cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: .55rem;
      text-align: center;
      transition: border-color .22s, background .22s, transform .18s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .es-role-card:hover { border-color: var(--border-hi); transform: translateY(-2px); }
    .es-role-card:active { transform: scale(.98); }
    .es-role-card--active {
      border-color: rgba(255,68,51,.55) !important;
      background: var(--coral-dim) !important;
      box-shadow: 0 0 18px rgba(255,68,51,.1);
    }
    .es-role-card__check {
      position: absolute; top: .65rem; right: .65rem;
      color: var(--coral); opacity: 0;
      transition: opacity .2s;
    }
    .es-role-card__check--on { opacity: 1; }
    .es-role-card__icon {
      width: 40px; height: 40px;
      background: rgba(255,68,51,.1);
      border: 1px solid rgba(255,68,51,.18);
      border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      color: var(--coral);
    }
    .es-role-card__title {
      font-family: var(--fd);
      font-size: 1.05rem; letter-spacing: .04em;
      color: var(--text); margin: 0;
    }
    .es-role-card__desc {
      font-size: .7rem; color: var(--muted);
      margin: 0; font-weight: 300;
    }

    /* ═══════════════════════════════════════════
       FORM
    ═══════════════════════════════════════════ */
    .es-form { display: flex; flex-direction: column; gap: .85rem; }
    .es-field { display: flex; flex-direction: column; gap: .4rem; }

    /* mobile: stacked name fields by default */
    .es-field-row {
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .es-label-row { display: flex; align-items: center; justify-content: space-between; }
    .es-label {
      font-size: .76rem; font-weight: 600;
      color: rgba(242,238,230,.75);
      letter-spacing: .02em;
    }
    .es-required { color: var(--coral); }

    /* input override */
    .es-input {
      width: 100%;
      background: var(--bg2) !important;
      border: 1px solid var(--border) !important;
      border-radius: 9px !important;
      color: var(--text) !important;
      font-family: var(--fb) !important;
      /* mobile: 16px prevents iOS auto-zoom */
      font-size: 1rem !important;
      padding: .7rem .9rem !important;
      transition: border-color .22s, box-shadow .22s !important;
      outline: none !important;
      /* mobile: full width, no overflow */
      box-sizing: border-box !important;
      -webkit-appearance: none;
    }
    .es-input:focus {
      border-color: rgba(255,68,51,.5) !important;
      box-shadow: 0 0 0 3px rgba(255,68,51,.08) !important;
    }
    .es-input::placeholder { color: var(--muted) !important; }
    .es-input--mono { font-family: var(--fm) !important; letter-spacing: .06em !important; }

    .es-field-error {
      font-size: .7rem; color: var(--coral); margin: 0;
      font-weight: 500;
    }

    /* ═══════════════════════════════════════════
       ALERTS
    ═══════════════════════════════════════════ */
    .es-alert {
      display: flex; align-items: flex-start; gap: 8px;
      padding: .65rem .9rem;
      border-radius: 9px;
      font-size: .8rem; line-height: 1.5;
    }
    .es-alert--error {
      background: rgba(255,68,51,.1);
      border: 1px solid rgba(255,68,51,.22);
      color: #ff7060;
    }
    .es-alert--success {
      background: rgba(34,214,98,.08);
      border: 1px solid rgba(34,214,98,.2);
      color: #4ade80;
    }

    /* ═══════════════════════════════════════════
       INFO STRIP
    ═══════════════════════════════════════════ */
    .es-info-strip {
      display: flex; align-items: flex-start; gap: 8px;
      padding: .65rem .9rem;
      background: rgba(240,180,41,.08);
      border: 1px solid rgba(240,180,41,.18);
      border-radius: 9px;
      font-size: .76rem; color: rgba(240,180,41,.9);
      line-height: 1.5;
    }
    .es-info-strip__icon { flex-shrink: 0; margin-top: 1px; }

    /* ═══════════════════════════════════════════
       ALT LINK
    ═══════════════════════════════════════════ */
    .es-auth__alt-link {
      text-align: center;
      font-size: .8rem;
      color: var(--muted);
      padding-top: .15rem;
    }

    /* ═══════════════════════════════════════════
       ICONS
    ═══════════════════════════════════════════ */
    .es-icon    { width: 16px; height: 16px; display: inline-flex; }
    .es-icon-sm { width: 14px; height: 14px; display: inline-flex; }
    .es-icon-lg { width: 20px; height: 20px; display: inline-flex; }

    /* spin */
    .es-spin { animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* divider */
    z-divider { border-color: var(--border); }


    /* ═══════════════════════════════════════════
       BREAKPOINT: sm  ≥ 480px
       — side-by-side name fields, 2-col role grid
    ═══════════════════════════════════════════ */
    @media (min-width: 480px) {
      .es-auth__pane {
        padding: 1.75rem 1.5rem 2rem;
        gap: 1.35rem;
      }

      .es-auth__title { font-size: 2.1rem; }
      .es-auth__sub   { font-size: .86rem; }

      /* role cards: 2 columns */
      .es-role-grid {
        grid-template-columns: 1fr 1fr;
        gap: .85rem;
      }

      /* name fields side-by-side */
      .es-field-row {
        flex-direction: row;
        gap: .75rem;
      }

      /* inputs can shrink back to design size */
      .es-input { font-size: .88rem !important; }

      .es-btn-primary { padding: .82rem 1.1rem .82rem 1.35rem; font-size: .92rem; }
      .es-btn-ghost   { padding: .82rem 1.35rem; font-size: .9rem; }
    }


    /* ═══════════════════════════════════════════
       BREAKPOINT: md  ≥ 640px
       — restored desktop spacing & glow
    ═══════════════════════════════════════════ */
    @media (min-width: 640px) {
      .es-auth__pane {
        padding: 2rem 1.75rem 2rem;
        gap: 1.5rem;
      }

      .es-auth__glow {
        width: 400px; height: 400px;
      }

      .es-auth__logo-ring { width: 40px; height: 40px; }
      .es-auth__logo-name { font-size: 1.5rem; }

      .es-auth__title { font-size: 2.2rem; }

      .es-role-card   { padding: 1.25rem 1rem; }

      .es-form { gap: 1rem; }
      .es-field { gap: .45rem; }

      .es-btn-primary__icon { width: 28px; height: 28px; border-radius: 8px; }
    }
  `],
})
export class AuthDialog {
  private readonly dialogRef   = inject(ZardDialogRef);
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  step          = signal<DialogStep>('welcome');
  selectedRole  = signal<UserRole>('user');
  loginRole     = signal<UserRole>('organizer');
  isSubmitting  = signal(false);
  errorMessage  = signal('');
  successMessage = signal('');

  readonly icons = {
    calendar:    'calendar'     as ZardIcon,
    userPlus:    'user-plus'    as ZardIcon,
    logIn:       'log-in'       as ZardIcon,
    arrowLeft:   'arrow-left'   as ZardIcon,
    briefcase:   'briefcase'    as ZardIcon,
    user:        'user'         as ZardIcon,
    alertCircle: 'alert-circle' as ZardIcon,
    checkCircle: 'check-circle' as ZardIcon,
    loader:      'loader'       as ZardIcon,
    mail:        'mail'         as ZardIcon,
    key:         'key'          as ZardIcon,
  };

  registerForm!: FormGroup;
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  constructor() { this.initForms(); }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email:    ['test@acmedigital.com', [Validators.required, Validators.email]],
      password: ['TestPass123!',         [Validators.required]],
    });
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.resetPasswordForm = this.fb.group({
      email:       ['', [Validators.required, Validators.email]],
      token:       ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.buildRegisterForm();
  }

  private buildRegisterForm(): void {
    if (this.selectedRole() === 'organizer') {
      this.registerForm = this.fb.group({
        name:     ['', [Validators.required, Validators.minLength(3)]],
        email:    ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    } else {
      this.registerForm = this.fb.group({
        firstName: ['', [Validators.required]],
        lastName:  ['', [Validators.required]],
        email:     ['', [Validators.required, Validators.email]],
        password:  ['', [Validators.required, Validators.minLength(6)]],
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  goToRoleSelection(): void { this.step.set('role-selection'); this.clearMessages(); }
  goToLogin():         void { this.step.set('login');          this.loginForm.reset(); this.loginRole.set('organizer'); this.clearMessages(); }
  backToWelcome():     void { this.step.set('welcome');        this.clearMessages(); }
  backToRoleSelection():void{ this.step.set('role-selection'); this.clearMessages(); }
  backToLogin():       void { this.step.set('login');          this.clearMessages(); }
  goToForgotPassword():void {
    this.step.set('forgot-password');
    this.forgotPasswordForm.patchValue({ email: this.loginForm.get('email')?.value || '' });
    this.clearMessages();
  }

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.buildRegisterForm();
    this.step.set('register');
    this.clearMessages();
  }

  onRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.clearMessages();

    const formValue: RegisterDto = this.registerForm.value;
    const role = this.selectedRole();

    this.authService.register(formValue, role).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.successMessage.set(
            role === 'organizer'
              ? 'Organizer account created! You can now login.'
              : 'Account created! You can now browse events.'
          );
          this.loginForm.patchValue({ email: formValue.email, password: formValue.password });
          setTimeout(() => {
            role === 'organizer' ? this.step.set('login') : this.dialogRef.close();
            this.clearMessages();
          }, 2000);
        } else {
          this.errorMessage.set(response.message || 'Registration failed');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.clearMessages();

    const payload: LoginDto = this.loginForm.value;
    this.authService.login(payload, 'organizer').subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        const hasToken = typeof response.data === 'string'
          ? response.data : response.data?.token || response.token;
        if (response.success && hasToken) {
          this.successMessage.set('Login successful! Redirecting…');
          setTimeout(() => { this.dialogRef.close(); this.router.navigate(['/dashboard']); }, 1000);
        } else {
          this.errorMessage.set(response.message || 'Login failed — no token received');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        let msg = err.error?.message || 'Login failed. Please check your credentials.';
        if (msg.includes('Invalid') || msg.includes('password'))
          msg += ' Make sure you registered as an Organizer.';
        this.errorMessage.set(msg);
      },
    });
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.clearMessages();

    const payload: ForgotPasswordDto = this.forgotPasswordForm.value;
    this.authService.forgotPassword(payload, 'organizer').subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.successMessage.set('Reset link sent! Check your inbox.');
          setTimeout(() => {
            this.step.set('reset-password');
            this.resetPasswordForm.patchValue({ email: payload.email });
            this.clearMessages();
          }, 2500);
        } else {
          this.errorMessage.set(response.message || 'Failed to send reset link');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send reset link.');
      },
    });
  }

  onResetPassword(): void {
    if (this.resetPasswordForm.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.clearMessages();

    const payload: ResetPasswordDto = this.resetPasswordForm.value;
    this.authService.resetPassword(payload, 'organizer').subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.successMessage.set('Password reset! You can now login.');
          setTimeout(() => {
            this.step.set('login');
            this.loginForm.patchValue({ email: payload.email });
            this.clearMessages();
          }, 2000);
        } else {
          this.errorMessage.set(response.message || 'Password reset failed');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Reset failed. Please check your token.');
      },
    });
  }
}