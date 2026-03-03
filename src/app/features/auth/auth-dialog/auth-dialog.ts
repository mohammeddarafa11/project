// src/app/features/auth/auth-dialog/auth-dialog.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZardDialogRef } from '@shared/components/dialog/dialog-ref';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import {
  AuthService, UserRole, RegisterDto, LoginDto,
  ForgotPasswordDto, ResetPasswordDto, VerifyAccountDto,
} from '@core/services/auth.service';
import { CategorySelectSheet } from '../category-select-sheet/category-select-sheet';

type Step = 'welcome' | 'role-selection' | 'register' | 'verify'
           | 'login-role-selection' | 'login' | 'forgot-password' | 'reset-password';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZardInputDirective, ZardIconComponent],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

    <div class="ad-shell">
      <!-- ambient glow -->
      <div class="ad-glow" aria-hidden="true"></div>
      <div class="ad-grain" aria-hidden="true"></div>

      <!-- ═══════════════════════ WELCOME ═══════════════════════ -->
      @if (step() === 'welcome') {
        <div class="ad-pane" @.disabled>
          <div class="ad-brand">
            <div class="ad-brand-ring">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 2v4M18 2v4M3 10h18M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>
              </svg>
            </div>
            <span class="ad-brand-name">Eventsora</span>
          </div>
          <div class="ad-head">
            <h2 class="ad-title">Your events,<br/><span class="ad-title-stroke">your world.</span></h2>
            <p class="ad-sub">Egypt's premier events platform — discover, create & attend.</p>
          </div>
          <div class="ad-stack">
            <button class="ad-cta" (click)="goto('role-selection')">
              <span>Create Account</span>
              <span class="ad-cta-icon">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              </span>
            </button>
            <button class="ad-ghost" (click)="goto('login-role-selection')">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M3 12h12"/></svg>
              Sign In
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════ ROLE SELECTION (Register) ═══════════════════════ -->
      @if (step() === 'role-selection') {
        <div class="ad-pane ad-anim">
          <button class="ad-back" (click)="goto('welcome')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div class="ad-head">
            <div class="ad-step-label">Step 1 / 2 — Account type</div>
            <h2 class="ad-title ad-title--sm">Join as…</h2>
          </div>
          <div class="ad-roles">
            <button class="ad-role" [class.ad-role--active]="regRole() === 'organizer'" (click)="setRegRole('organizer')">
              <div class="ad-role-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
              <div class="ad-role-icon ad-role-icon--coral">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"/></svg>
              </div>
              <strong class="ad-role-name">Organizer</strong>
              <span class="ad-role-hint">Create & manage events</span>
            </button>
            <button class="ad-role" [class.ad-role--active]="regRole() === 'user'" (click)="setRegRole('user')">
              <div class="ad-role-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
              <div class="ad-role-icon ad-role-icon--gold">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
              <strong class="ad-role-name">Attendee</strong>
              <span class="ad-role-hint">Discover & book events</span>
            </button>
          </div>
          <div class="ad-divider-text">Already have an account? <button class="ad-link" (click)="goto('login-role-selection')">Sign in</button></div>
        </div>
      }

      <!-- ═══════════════════════ REGISTER FORM ═══════════════════════ -->
      @if (step() === 'register') {
        <div class="ad-pane ad-anim">
          <button class="ad-back" (click)="goto('role-selection')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div class="ad-head">
            <div class="ad-badge" [class.ad-badge--gold]="regRole() === 'user'">
              {{ regRole() === 'organizer' ? 'Organizer Account' : 'Attendee Account' }}
            </div>
            <h2 class="ad-title ad-title--sm">Create account</h2>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="ad-form">
            @if (regRole() === 'organizer') {
              <div class="ad-field">
                <label class="ad-label">Organization Name *</label>
                <input z-input formControlName="name" type="text" placeholder="e.g. Cairo Creative Hub" class="ad-input"/>
                @if (f('name').invalid && f('name').touched) { <span class="ad-ferr">Required</span> }
              </div>
            } @else {
              <div class="ad-row">
                <div class="ad-field">
                  <label class="ad-label">First Name *</label>
                  <input z-input formControlName="firstName" type="text" placeholder="Ahmed" class="ad-input"/>
                  @if (f('firstName').invalid && f('firstName').touched) { <span class="ad-ferr">Required</span> }
                </div>
                <div class="ad-field">
                  <label class="ad-label">Last Name *</label>
                  <input z-input formControlName="lastName" type="text" placeholder="Hassan" class="ad-input"/>
                  @if (f('lastName').invalid && f('lastName').touched) { <span class="ad-ferr">Required</span> }
                </div>
              </div>
            }
            <div class="ad-field">
              <label class="ad-label">Email *</label>
              <input z-input formControlName="email" type="email" placeholder="you@example.com" class="ad-input"/>
              @if (f('email').invalid && f('email').touched) { <span class="ad-ferr">Valid email required</span> }
            </div>
            <div class="ad-field">
              <label class="ad-label">Password *</label>
              <input z-input formControlName="password" type="password" placeholder="Min. 6 characters" class="ad-input"/>
              @if (f('password').invalid && f('password').touched) { <span class="ad-ferr">Min. 6 characters</span> }
            </div>

            @if (err()) { <div class="ad-alert ad-alert--err">{{ err() }}</div> }
            @if (ok()) { <div class="ad-alert ad-alert--ok">{{ ok() }}</div> }

            <button type="submit" class="ad-cta" [class.ad-cta--gold]="regRole() === 'user'" [disabled]="registerForm.invalid || busy()">
              @if (busy()) { <span class="ad-spin"></span> Creating… }
              @else { <span>Create Account</span><span class="ad-cta-icon">→</span> }
            </button>
          </form>
          <div class="ad-divider-text">Have an account? <button class="ad-link" (click)="goto('login-role-selection')">Sign in</button></div>
        </div>
      }

      <!-- ═══════════════════════ VERIFY EMAIL ═══════════════════════ -->
      @if (step() === 'verify') {
        <div class="ad-pane ad-anim">
          <div class="ad-verify-hero">
            <div class="ad-verify-orb">
              <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
            </div>
            <h2 class="ad-title ad-title--sm">Check your inbox</h2>
            <p class="ad-sub">We sent a verification code to<br/><strong class="ad-em">{{ pendingEmail() }}</strong></p>
          </div>

          <form [formGroup]="verifyForm" (ngSubmit)="onVerify()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Verification Code *</label>
              <input z-input formControlName="code" type="text" maxlength="10"
                     placeholder="Enter code" class="ad-input ad-input--code"
                     autocomplete="one-time-code" inputmode="numeric"/>
            </div>

            @if (err()) { <div class="ad-alert ad-alert--err">{{ err() }}</div> }
            @if (ok()) { <div class="ad-alert ad-alert--ok">{{ ok() }}</div> }

            <button type="submit" class="ad-cta ad-cta--gold" [disabled]="verifyForm.invalid || busy()">
              @if (busy()) { <span class="ad-spin"></span> Verifying… }
              @else { <span>Verify & Continue</span><span class="ad-cta-icon">→</span> }
            </button>
          </form>
          <div class="ad-divider-text">Wrong email? <button class="ad-link" (click)="goto('role-selection')">Go back</button></div>
        </div>
      }

      <!-- ═══════════════════════ LOGIN ROLE ═══════════════════════ -->
      @if (step() === 'login-role-selection') {
        <div class="ad-pane ad-anim">
          <button class="ad-back" (click)="goto('welcome')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div class="ad-head">
            <h2 class="ad-title ad-title--sm">Welcome back</h2>
            <p class="ad-sub">Who are you logging in as?</p>
          </div>
          <div class="ad-roles">
            <button class="ad-role" [class.ad-role--active]="loginRole() === 'organizer'" (click)="setLoginRole('organizer')">
              <div class="ad-role-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
              <div class="ad-role-icon ad-role-icon--coral">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"/></svg>
              </div>
              <strong class="ad-role-name">Organizer</strong>
              <span class="ad-role-hint">Manage events</span>
            </button>
            <button class="ad-role" [class.ad-role--active]="loginRole() === 'user'" (click)="setLoginRole('user')">
              <div class="ad-role-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
              <div class="ad-role-icon ad-role-icon--gold">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
              <strong class="ad-role-name">Attendee</strong>
              <span class="ad-role-hint">Explore events</span>
            </button>
          </div>
          <div class="ad-divider-text">New here? <button class="ad-link" (click)="goto('role-selection')">Sign up</button></div>
        </div>
      }

      <!-- ═══════════════════════ LOGIN FORM ═══════════════════════ -->
      @if (step() === 'login') {
        <div class="ad-pane ad-anim">
          <button class="ad-back" (click)="goto('login-role-selection')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div class="ad-head">
            <div class="ad-badge" [class.ad-badge--gold]="loginRole() === 'user'">
              {{ loginRole() === 'organizer' ? 'Organizer' : 'Attendee' }}
            </div>
            <h2 class="ad-title ad-title--sm">Sign in</h2>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Email</label>
              <input z-input formControlName="email" type="email" placeholder="you@example.com" class="ad-input"/>
            </div>
            <div class="ad-field">
              <div class="ad-label-row">
                <label class="ad-label">Password</label>
                <button type="button" class="ad-link ad-link--sm" (click)="goto('forgot-password')">Forgot?</button>
              </div>
              <input z-input formControlName="password" type="password" placeholder="Your password" class="ad-input"/>
            </div>

            @if (err()) { <div class="ad-alert ad-alert--err">{{ err() }}</div> }
            @if (ok()) { <div class="ad-alert ad-alert--ok">{{ ok() }}</div> }

            <button type="submit" class="ad-cta" [class.ad-cta--gold]="loginRole() === 'user'"
                    [disabled]="loginForm.invalid || busy()">
              @if (busy()) { <span class="ad-spin"></span> Signing in… }
              @else { <span>Sign in as {{ loginRole() === 'organizer' ? 'Organizer' : 'Attendee' }}</span><span class="ad-cta-icon">→</span> }
            </button>
          </form>
          <div class="ad-divider-text">No account? <button class="ad-link" (click)="goto('role-selection')">Sign up</button></div>
        </div>
      }

      <!-- ═══════════════════════ FORGOT ═══════════════════════ -->
      @if (step() === 'forgot-password') {
        <div class="ad-pane ad-anim">
          <button class="ad-back" (click)="goto('login')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div class="ad-head">
            <h2 class="ad-title ad-title--sm">Forgot password</h2>
            <p class="ad-sub">Enter your email and we'll send reset instructions</p>
          </div>
          <form [formGroup]="forgotForm" (ngSubmit)="onForgot()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Email</label>
              <input z-input formControlName="email" type="email" placeholder="you@example.com" class="ad-input"/>
            </div>
            @if (err()) { <div class="ad-alert ad-alert--err">{{ err() }}</div> }
            @if (ok()) { <div class="ad-alert ad-alert--ok">{{ ok() }}</div> }
            <button type="submit" class="ad-cta" [disabled]="forgotForm.invalid || busy()">
              @if (busy()) { <span class="ad-spin"></span> Sending… }
              @else { <span>Send Reset Link</span><span class="ad-cta-icon">→</span> }
            </button>
          </form>
        </div>
      }

      <!-- ═══════════════════════ RESET ═══════════════════════ -->
      @if (step() === 'reset-password') {
        <div class="ad-pane ad-anim">
          <button class="ad-back" (click)="goto('login')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div class="ad-head">
            <h2 class="ad-title ad-title--sm">Reset password</h2>
          </div>
          <form [formGroup]="resetForm" (ngSubmit)="onReset()" class="ad-form">
            <div class="ad-field"><label class="ad-label">Email</label><input z-input formControlName="email" type="email" class="ad-input"/></div>
            <div class="ad-field"><label class="ad-label">Reset Token</label><input z-input formControlName="token" type="text" class="ad-input ad-input--code"/></div>
            <div class="ad-field"><label class="ad-label">New Password</label><input z-input formControlName="newPassword" type="password" class="ad-input"/></div>
            @if (err()) { <div class="ad-alert ad-alert--err">{{ err() }}</div> }
            @if (ok()) { <div class="ad-alert ad-alert--ok">{{ ok() }}</div> }
            <button type="submit" class="ad-cta" [disabled]="resetForm.invalid || busy()">
              @if (busy()) { <span class="ad-spin"></span> Resetting… }
              @else { <span>Reset Password</span><span class="ad-cta-icon">→</span> }
            </button>
          </form>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --coral:  #FF4433;
      --gold:   #F0B429;
      --bg:     #09090c;
      --bg2:    #111116;
      --text:   #F2EEE6;
      --muted:  rgba(242,238,230,.45);
      --bdr:    rgba(242,238,230,.08);
      --bdrhi:  rgba(242,238,230,.14);
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: block; width: 100%;
    }

    /* Shell */
    .ad-shell {
      position: relative; width: 100%; background: var(--bg);
      color: var(--text); overflow: hidden;
    }
    .ad-glow {
      position: absolute; top: -80px; left: -60px;
      width: 280px; height: 280px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,68,51,.06) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }
    .ad-grain {
      position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: .5;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
    }

    /* Pane */
    .ad-pane {
      position: relative; z-index: 1;
      padding: 1.5rem 1.25rem 1.75rem;
      display: flex; flex-direction: column; gap: 1.25rem;
    }
    .ad-anim { animation: fadeUp .3s cubic-bezier(.22,1,.36,1) both; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

    /* Brand */
    .ad-brand { display: flex; align-items: center; gap: 9px; }
    .ad-brand-ring {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      border: 1.5px solid rgba(255,68,51,.4); background: rgba(255,68,51,.08);
      color: var(--coral); display: flex; align-items: center; justify-content: center;
    }
    .ad-brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; letter-spacing: .06em; }

    /* Head */
    .ad-head { display: flex; flex-direction: column; gap: .4rem; }
    .ad-step-label {
      font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: .14em;
      text-transform: uppercase; color: var(--muted);
    }
    .ad-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem;
      letter-spacing: .04em; line-height: 1; margin: 0; color: var(--text);
    }
    .ad-title--sm { font-size: 1.85rem; }
    .ad-title-stroke {
      -webkit-text-stroke: 1.5px var(--coral); color: transparent;
    }
    .ad-sub { font-size: .83rem; color: var(--muted); line-height: 1.65; margin: 0; font-weight: 300; }
    .ad-em { color: var(--text); font-weight: 600; font-style: normal; }

    .ad-badge {
      display: inline-flex; align-items: center; width: fit-content;
      padding: 3px 10px; border-radius: 100px;
      background: rgba(255,68,51,.1); border: 1px solid rgba(255,68,51,.25);
      font-family: 'DM Mono', monospace; font-size: .62rem; letter-spacing: .1em;
      text-transform: uppercase; color: var(--coral);
    }
    .ad-badge--gold { background: rgba(240,180,41,.1); border-color: rgba(240,180,41,.25); color: var(--gold); }

    /* Verify hero */
    .ad-verify-hero { display: flex; flex-direction: column; align-items: center; gap: .75rem; text-align: center; }
    .ad-verify-orb {
      width: 64px; height: 64px; border-radius: 18px;
      background: rgba(240,180,41,.08); border: 1px solid rgba(240,180,41,.2);
      color: var(--gold); display: flex; align-items: center; justify-content: center;
    }

    /* Roles */
    .ad-roles { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .ad-role {
      position: relative; padding: 1.1rem .85rem 1rem;
      background: var(--bg2); border: 1px solid var(--bdr); border-radius: 14px;
      cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: .45rem;
      text-align: center; transition: border-color .2s, transform .18s, background .2s;
      -webkit-tap-highlight-color: transparent;
    }
    .ad-role:hover { border-color: var(--bdrhi); transform: translateY(-2px); }
    .ad-role--active { border-color: rgba(255,68,51,.5) !important; background: rgba(255,68,51,.05) !important; }
    .ad-role-check {
      position: absolute; top: .55rem; right: .55rem;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--coral); color: #fff;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: scale(.5); transition: opacity .2s, transform .2s;
    }
    .ad-role--active .ad-role-check { opacity: 1; transform: scale(1); }
    .ad-role-icon {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .ad-role-icon--coral { background: rgba(255,68,51,.1); border: 1px solid rgba(255,68,51,.18); color: var(--coral); }
    .ad-role-icon--gold  { background: rgba(240,180,41,.1); border: 1px solid rgba(240,180,41,.18); color: var(--gold); }
    .ad-role-name { font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: .04em; color: var(--text); }
    .ad-role-hint { font-size: .68rem; color: var(--muted); font-weight: 300; }

    /* Buttons */
    .ad-stack { display: flex; flex-direction: column; gap: .6rem; }
    .ad-cta {
      width: 100%; display: inline-flex; align-items: center; justify-content: space-between;
      padding: .8rem 1rem .8rem 1.25rem; border-radius: 12px;
      background: var(--coral); color: #fff; border: none;
      font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: .9rem;
      cursor: pointer; position: relative; overflow: hidden;
      transition: box-shadow .25s, transform .18s, opacity .2s;
      box-shadow: 0 0 28px rgba(255,68,51,.2);
    }
    .ad-cta::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.14) 0%, transparent 55%);
      pointer-events: none;
    }
    .ad-cta--gold { background: var(--gold); color: #1a1200; box-shadow: 0 0 28px rgba(240,180,41,.22); }
    .ad-cta--gold:hover:not(:disabled) { box-shadow: 0 0 48px rgba(240,180,41,.4); }
    .ad-cta:hover:not(:disabled) { box-shadow: 0 0 48px rgba(255,68,51,.4); transform: translateY(-1px); }
    .ad-cta:disabled { opacity: .45; cursor: not-allowed; transform: none; }
    .ad-cta-icon {
      width: 28px; height: 28px; border-radius: 8px;
      background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center;
      font-size: 1rem; transition: transform .2s; flex-shrink: 0;
    }
    .ad-cta:hover:not(:disabled) .ad-cta-icon { transform: translateX(3px); }

    .ad-ghost {
      width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: .8rem 1.25rem; border-radius: 12px;
      background: transparent; color: var(--text); border: 1px solid var(--bdrhi);
      font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; font-size: .9rem;
      cursor: pointer; transition: border-color .22s, background .22s, color .22s;
    }
    .ad-ghost:hover { border-color: rgba(255,68,51,.4); background: rgba(255,68,51,.05); color: #ff7060; }

    .ad-back {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: none; padding: 0; min-height: 32px;
      font-size: .78rem; font-weight: 500; color: var(--muted); cursor: pointer;
      transition: color .2s; width: fit-content;
    }
    .ad-back:hover { color: var(--text); }

    .ad-link { background: none; border: none; padding: 0; color: var(--coral); font-weight: 600; font-size: inherit; cursor: pointer; transition: opacity .2s; }
    .ad-link:hover { opacity: .8; }
    .ad-link--sm { font-size: .76rem; font-weight: 500; }

    /* Form */
    .ad-form { display: flex; flex-direction: column; gap: .85rem; }
    .ad-field { display: flex; flex-direction: column; gap: .38rem; }
    .ad-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .ad-label-row { display: flex; align-items: center; justify-content: space-between; }
    .ad-label { font-size: .74rem; font-weight: 600; color: rgba(242,238,230,.7); letter-spacing: .01em; }
    .ad-input {
      width: 100%; background: var(--bg2) !important; border: 1px solid var(--bdr) !important;
      border-radius: 9px !important; color: var(--text) !important;
      font-family: 'Plus Jakarta Sans', sans-serif !important; font-size: .88rem !important;
      padding: .7rem .9rem !important; transition: border-color .2s, box-shadow .2s !important;
      outline: none !important; box-sizing: border-box !important;
    }
    .ad-input:focus { border-color: rgba(255,68,51,.5) !important; box-shadow: 0 0 0 3px rgba(255,68,51,.08) !important; }
    .ad-input::placeholder { color: rgba(242,238,230,.25) !important; }
    .ad-input--code {
      font-family: 'DM Mono', monospace !important; letter-spacing: .2em !important;
      font-size: 1.1rem !important; text-align: center !important;
    }
    .ad-ferr { font-size: .7rem; color: var(--coral); }
    .ad-alert {
      padding: .6rem .85rem; border-radius: 9px; font-size: .8rem; line-height: 1.5;
    }
    .ad-alert--err { background: rgba(255,68,51,.1); border: 1px solid rgba(255,68,51,.22); color: #ff7060; }
    .ad-alert--ok  { background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2); color: #4ade80; }

    /* Misc */
    .ad-divider-text { text-align: center; font-size: .8rem; color: var(--muted); }
    .ad-spin {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
      border-radius: 50%; display: inline-block; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 380px) {
      .ad-row { grid-template-columns: 1fr; }
    }
  `],
})
export class AuthDialog implements OnInit {
  private readonly dialogRef   = inject(ZardDialogRef);
  private readonly dialogSvc   = inject(ZardDialogService);
  private readonly fb          = inject(FormBuilder);
  private readonly auth        = inject(AuthService);
  private readonly router      = inject(Router);

  step       = signal<Step>('welcome');
  regRole    = signal<UserRole>('user');
  loginRole  = signal<UserRole>('organizer');
  pendingEmail = signal('');
  busy       = signal(false);
  err        = signal('');
  ok         = signal('');

  registerForm!: FormGroup;
  verifyForm!: FormGroup;
  loginForm!: FormGroup;
  forgotForm!: FormGroup;
  resetForm!: FormGroup;

  ngOnInit() { this.buildForms(); }

  private buildForms() {
    this.verifyForm = this.fb.group({ code: ['', Validators.required] });
    this.loginForm  = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.forgotForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
    this.resetForm  = this.fb.group({
      email:       ['', [Validators.required, Validators.email]],
      token:       ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.buildRegisterForm();
  }

  private buildRegisterForm() {
    this.registerForm = this.regRole() === 'organizer'
      ? this.fb.group({
          name:     ['', [Validators.required, Validators.minLength(2)]],
          email:    ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required, Validators.minLength(6)]],
        })
      : this.fb.group({
          firstName: ['', Validators.required],
          lastName:  ['', Validators.required],
          email:     ['', [Validators.required, Validators.email]],
          password:  ['', [Validators.required, Validators.minLength(6)]],
        });
  }

  f(name: string) { return this.registerForm.get(name)!; }

  goto(s: Step) { this.step.set(s); this.err.set(''); this.ok.set(''); }
  setRegRole(r: UserRole)   { this.regRole.set(r);   this.buildRegisterForm(); this.goto('register'); }
  setLoginRole(r: UserRole) { this.loginRole.set(r); this.goto('login'); }

  private clear() { this.err.set(''); this.ok.set(''); }

  /* ── Register ── */
  onRegister() {
    if (this.registerForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    const data: RegisterDto = this.registerForm.value;
    this.auth.register(data, this.regRole()).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          const email = this.registerForm.get('email')!.value;
          this.pendingEmail.set(email);
          if (this.regRole() === 'user') {
            this.ok.set('Account created! Check your email for the verification code.');
            setTimeout(() => { this.goto('verify'); }, 1200);
          } else {
            this.ok.set('Organizer account created! Please sign in.');
            setTimeout(() => {
              this.loginRole.set('organizer');
              this.loginForm.patchValue({ email, password: data.password });
              this.goto('login');
            }, 1500);
          }
        } else { this.err.set(r.message || 'Registration failed'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Registration failed'); },
    });
  }

  /* ── Verify ── */
  onVerify() {
    if (this.verifyForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    const dto: VerifyAccountDto = { email: this.pendingEmail(), code: this.verifyForm.get('code')!.value };
    this.auth.verifyAccount(dto).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Email verified! Redirecting to sign in…');
          setTimeout(() => {
            this.loginRole.set('user');
            this.loginForm.patchValue({ email: this.pendingEmail() });
            this.goto('login');
          }, 1200);
        } else { this.err.set(r.message || 'Verification failed'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Invalid or expired code'); },
    });
  }

  /* ── Login ── */
  onLogin() {
    if (this.loginForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    const payload: LoginDto = this.loginForm.value;
    const role = this.loginRole();
    this.auth.login(payload, role).subscribe({
      next: r => {
        this.busy.set(false);
        const token = typeof r.data === 'string' ? r.data : (r.data as any)?.token || r.token;
        if (r.success && token) {
          if (role === 'user') {
            // Close auth dialog & open category sheet
            this.ok.set('Welcome! Let\'s personalise your feed…');
            setTimeout(() => {
              this.dialogRef.close();
              this.openCategorySheet();
            }, 700);
          } else {
            this.ok.set('Welcome back! Redirecting…');
            setTimeout(() => { this.dialogRef.close(); this.router.navigate(['/dashboard']); }, 900);
          }
        } else { this.err.set(r.message || 'Login failed — no token'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Login failed'); },
    });
  }

  private openCategorySheet() {
    this.dialogSvc.create({
      zContent: CategorySelectSheet,
      zData: {},
    });
  }
  /* ── Forgot / Reset ── */
  onForgot() {
    if (this.forgotForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    this.auth.forgotPassword(this.forgotForm.value, this.loginRole()).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Reset link sent! Check your inbox.');
          setTimeout(() => {
            this.resetForm.patchValue({ email: this.forgotForm.get('email')!.value });
            this.goto('reset-password');
          }, 2500);
        } else { this.err.set(r.message || 'Failed to send reset link'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Failed'); },
    });
  }

  onReset() {
    if (this.resetForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    this.auth.resetPassword(this.resetForm.value, this.loginRole()).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Password reset! You can now sign in.');
          setTimeout(() => {
            this.loginForm.patchValue({ email: this.resetForm.get('email')!.value });
            this.goto('login');
          }, 2000);
        } else { this.err.set(r.message || 'Reset failed'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Reset failed'); },
    });
  }
}