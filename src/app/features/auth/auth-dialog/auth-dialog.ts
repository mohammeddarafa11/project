// src/app/features/auth/auth-dialog/auth-dialog.ts
import { Component, inject, signal, InjectionToken, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZardDialogRef } from '@shared/components/dialog/dialog-ref';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import {
  AuthService, UserRole, RegisterDto, LoginDto,
  VerifyAccountDto,
} from '@core/services/auth.service';

export const ZARD_DIALOG_DATA = new InjectionToken<unknown>('ZardDialogData');

type Step =
  | 'role-selection'
  | 'register'
  | 'verify'
  | 'login-role-selection'
  | 'login'
  | 'forgot-password'
  | 'reset-password';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZardInputDirective, ZardIconComponent],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

    <div class="ad-shell" (click)="$event.stopPropagation()">

      <div class="ad-glow" aria-hidden="true"></div>
      <div class="ad-grain" aria-hidden="true"></div>

      <!-- Close button -->
      <button type="button" (click)="close()" class="ad-close" aria-label="Close">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- ═══ REGISTER: ROLE SELECTION ═══ -->
      @if (step() === 'role-selection') {
        <div class="ad-pane">
          <ng-container *ngTemplateOutlet="brandTpl"></ng-container>

          <div class="ad-progress-wrap">
            <div class="ad-progress-track">
              <div class="ad-progress-fill" style="width:50%"></div>
            </div>
            <span class="ad-step-label">Step 1 of 2 — Account type</span>
          </div>

          <div class="ad-head">
            <h2 class="ad-title">Join as…</h2>
            <p class="ad-sub">Choose how you want to use Eventsora</p>
          </div>

          <div class="ad-roles">
            <button type="button" class="ad-role"
                    [class.ad-role--coral]="regRole() === 'organizer'"
                    (click)="selectRegRole('organizer')">
              <ng-container *ngTemplateOutlet="checkTpl; context:{ active: regRole()==='organizer', gold: false }"></ng-container>
              <div class="ad-role-icon ad-role-icon--coral">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"/>
                </svg>
              </div>
              <strong class="ad-role-name">Organizer</strong>
              <span class="ad-role-hint">Create &amp; manage events</span>
            </button>

            <button type="button" class="ad-role"
                    [class.ad-role--gold]="regRole() === 'user'"
                    (click)="selectRegRole('user')">
              <ng-container *ngTemplateOutlet="checkTpl; context:{ active: regRole()==='user', gold: true }"></ng-container>
              <div class="ad-role-icon ad-role-icon--gold">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
              </div>
              <strong class="ad-role-name">Attendee</strong>
              <span class="ad-role-hint">Discover &amp; book events</span>
            </button>
          </div>

          <p class="ad-footer-text">
            Already have an account?
            <button type="button" class="ad-link" (click)="goto('login-role-selection')">Sign in</button>
          </p>
        </div>
      }

      <!-- ═══ REGISTER: FORM ═══ -->
      @if (step() === 'register') {
        <div class="ad-pane">
          <ng-container *ngTemplateOutlet="backTpl; context:{ target: 'role-selection' }"></ng-container>

          <div class="ad-progress-wrap">
            <div class="ad-progress-track">
              <div class="ad-progress-fill" [class.ad-progress-fill--gold]="regRole()==='user'" style="width:100%"></div>
            </div>
            <span class="ad-step-label">Step 2 of 2 — Your details</span>
          </div>

          <div class="ad-head">
            <span class="ad-badge" [class.ad-badge--gold]="regRole()==='user'">
              {{ regRole()==='organizer' ? 'Organizer Account' : 'Attendee Account' }}
            </span>
            <h2 class="ad-title">Create account</h2>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="ad-form">
            @if (regRole() === 'organizer') {
              <div class="ad-field">
                <label class="ad-label">Organization Name *</label>
                <input z-input formControlName="name" type="text" placeholder="Cairo Creative Hub"
                       autocomplete="organization" class="ad-input"/>
                @if (f('name').invalid && f('name').touched) {
                  <span class="ad-ferr">Required</span>
                }
              </div>
            } @else {
              <div class="ad-row">
                <div class="ad-field">
                  <label class="ad-label">First Name *</label>
                  <input z-input formControlName="firstName" type="text" placeholder="Ahmed"
                         autocomplete="given-name" class="ad-input"/>
                  @if (f('firstName').invalid && f('firstName').touched) {
                    <span class="ad-ferr">Required</span>
                  }
                </div>
                <div class="ad-field">
                  <label class="ad-label">Last Name *</label>
                  <input z-input formControlName="lastName" type="text" placeholder="Hassan"
                         autocomplete="family-name" class="ad-input"/>
                  @if (f('lastName').invalid && f('lastName').touched) {
                    <span class="ad-ferr">Required</span>
                  }
                </div>
              </div>
            }

            <div class="ad-field">
              <label class="ad-label">Email *</label>
              <input z-input formControlName="email" type="email" placeholder="you@example.com"
                     autocomplete="email" class="ad-input"/>
              @if (f('email').invalid && f('email').touched) {
                <span class="ad-ferr">Valid email required</span>
              }
            </div>

            <div class="ad-field">
              <label class="ad-label">Password *</label>
              <input z-input formControlName="password" type="password" placeholder="Min. 6 characters"
                     autocomplete="new-password" class="ad-input"/>
              @if (f('password').invalid && f('password').touched) {
                <span class="ad-ferr">Min. 6 characters</span>
              }
            </div>

            <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>

            <button type="submit" class="ad-cta" [class.ad-cta--gold]="regRole()==='user'"
                    [disabled]="registerForm.invalid || busy()">
              <span class="ad-cta-label">
                @if (busy()) { <span class="ad-spin"></span> Creating… }
                @else { Create Account }
              </span>
              @if (!busy()) { <span class="ad-cta-arrow">→</span> }
            </button>
          </form>

          <p class="ad-footer-text">
            Have an account?
            <button type="button" class="ad-link" (click)="goto('login-role-selection')">Sign in</button>
          </p>
        </div>
      }

      <!-- ═══ VERIFY EMAIL ═══ -->
      @if (step() === 'verify') {
        <div class="ad-pane">
          <div class="ad-verify-hero">
            <div class="ad-verify-orb">
              <svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
            </div>
            <h2 class="ad-title">Check your inbox</h2>
            <p class="ad-sub">
              We sent a verification code to<br/>
              <strong class="ad-em">{{ pendingEmail() }}</strong>
            </p>
          </div>

          <form [formGroup]="verifyForm" (ngSubmit)="onVerify()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Verification Code *</label>
              <input z-input formControlName="code" type="text" maxlength="10"
                     placeholder="· · · · · ·" inputmode="numeric" autocomplete="one-time-code"
                     aria-label="Email verification code" class="ad-input ad-input--code"/>
            </div>

            <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>

            <button type="submit" class="ad-cta ad-cta--gold" [disabled]="verifyForm.invalid || busy()">
              <span class="ad-cta-label">
                @if (busy()) { <span class="ad-spin ad-spin--dark"></span> Verifying… }
                @else { Verify &amp; Continue }
              </span>
              @if (!busy()) { <span class="ad-cta-arrow">→</span> }
            </button>
          </form>

          <p class="ad-footer-text">
            Wrong email?
            <button type="button" class="ad-link" (click)="goto('role-selection')">Go back</button>
          </p>
        </div>
      }

      <!-- ═══ LOGIN: ROLE SELECTION ═══ -->
      @if (step() === 'login-role-selection') {
        <div class="ad-pane">
          <ng-container *ngTemplateOutlet="brandTpl"></ng-container>

          <div class="ad-head">
            <h2 class="ad-title">Welcome back</h2>
            <p class="ad-sub">Who are you logging in as?</p>
          </div>

          <div class="ad-roles">
            <button type="button" class="ad-role"
                    [class.ad-role--coral]="loginRole() === 'organizer'"
                    (click)="selectLoginRole('organizer')">
              <ng-container *ngTemplateOutlet="checkTpl; context:{ active: loginRole()==='organizer', gold: false }"></ng-container>
              <div class="ad-role-icon ad-role-icon--coral">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"/>
                </svg>
              </div>
              <strong class="ad-role-name">Organizer</strong>
              <span class="ad-role-hint">Manage events</span>
            </button>

            <button type="button" class="ad-role"
                    [class.ad-role--gold]="loginRole() === 'user'"
                    (click)="selectLoginRole('user')">
              <ng-container *ngTemplateOutlet="checkTpl; context:{ active: loginRole()==='user', gold: true }"></ng-container>
              <div class="ad-role-icon ad-role-icon--gold">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
              </div>
              <strong class="ad-role-name">Attendee</strong>
              <span class="ad-role-hint">Explore events</span>
            </button>
          </div>

          <p class="ad-footer-text">
            New here?
            <button type="button" class="ad-link" (click)="goto('role-selection')">Sign up</button>
          </p>
        </div>
      }

      <!-- ═══ LOGIN: FORM ═══ -->
      @if (step() === 'login') {
        <div class="ad-pane">
          <ng-container *ngTemplateOutlet="backTpl; context:{ target: 'login-role-selection' }"></ng-container>

          <div class="ad-head">
            <span class="ad-badge" [class.ad-badge--gold]="loginRole()==='user'">
              {{ loginRole()==='organizer' ? 'Organizer' : 'Attendee' }}
            </span>
            <h2 class="ad-title">Sign in</h2>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Email</label>
              <input z-input formControlName="email" type="email" placeholder="you@example.com"
                     autocomplete="email" class="ad-input"/>
            </div>

            <div class="ad-field">
              <div class="ad-label-row">
                <label class="ad-label">Password</label>
                <button type="button" class="ad-link ad-link--sm" (click)="goto('forgot-password')">Forgot?</button>
              </div>
              <input z-input formControlName="password" type="password" placeholder="Your password"
                     autocomplete="current-password" class="ad-input"/>
            </div>

            <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>

            <button type="submit" class="ad-cta" [class.ad-cta--gold]="loginRole()==='user'"
                    [disabled]="loginForm.invalid || busy()">
              <span class="ad-cta-label">
                @if (busy()) { <span class="ad-spin"></span> Signing in… }
                @else { Sign in as {{ loginRole()==='organizer' ? 'Organizer' : 'Attendee' }} }
              </span>
              @if (!busy()) { <span class="ad-cta-arrow">→</span> }
            </button>
          </form>

          <p class="ad-footer-text">
            No account?
            <button type="button" class="ad-link" (click)="goto('role-selection')">Sign up</button>
          </p>
        </div>
      }

      <!-- ═══ FORGOT PASSWORD ═══ -->
      @if (step() === 'forgot-password') {
        <div class="ad-pane">
          <ng-container *ngTemplateOutlet="backTpl; context:{ target: 'login' }"></ng-container>

          <div class="ad-head">
            <h2 class="ad-title">Forgot password</h2>
            <p class="ad-sub">Enter your email and we'll send reset instructions</p>
          </div>

          <form [formGroup]="forgotForm" (ngSubmit)="onForgot()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Email</label>
              <input z-input formControlName="email" type="email" placeholder="you@example.com"
                     autocomplete="email" class="ad-input"/>
            </div>

            <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>

            <button type="submit" class="ad-cta" [disabled]="forgotForm.invalid || busy()">
              <span class="ad-cta-label">
                @if (busy()) { <span class="ad-spin"></span> Sending… }
                @else { Send Reset Link }
              </span>
              @if (!busy()) { <span class="ad-cta-arrow">→</span> }
            </button>
          </form>
        </div>
      }

      <!-- ═══ RESET PASSWORD ═══ -->
      @if (step() === 'reset-password') {
        <div class="ad-pane">
          <ng-container *ngTemplateOutlet="backTpl; context:{ target: 'login' }"></ng-container>

          <div class="ad-head">
            <h2 class="ad-title">Reset password</h2>
            <p class="ad-sub">Enter the token sent to your inbox</p>
          </div>

          <form [formGroup]="resetForm" (ngSubmit)="onReset()" class="ad-form">
            <div class="ad-field">
              <label class="ad-label">Email</label>
              <input z-input formControlName="email" type="email" autocomplete="email" class="ad-input"/>
            </div>

            <div class="ad-field">
              <label class="ad-label">Reset Token</label>
              <input z-input formControlName="token" type="text" autocomplete="one-time-code"
                     aria-label="Password reset token" class="ad-input ad-input--code"/>
            </div>

            <div class="ad-field">
              <label class="ad-label">New Password</label>
              <input z-input formControlName="newPassword" type="password"
                     autocomplete="new-password" class="ad-input"/>
            </div>

            <ng-container *ngTemplateOutlet="alertsTpl"></ng-container>

            <button type="submit" class="ad-cta" [disabled]="resetForm.invalid || busy()">
              <span class="ad-cta-label">
                @if (busy()) { <span class="ad-spin"></span> Resetting… }
                @else { Reset Password }
              </span>
              @if (!busy()) { <span class="ad-cta-arrow">→</span> }
            </button>
          </form>
        </div>
      }

      <!-- ══════════════ SHARED TEMPLATES ══════════════ -->

      <ng-template #brandTpl>
        <div class="ad-brand">
          <div class="ad-brand-ring">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 2v4M18 2v4M3 10h18M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>
            </svg>
          </div>
          <span class="ad-brand-name">Eventsora</span>
        </div>
      </ng-template>

      <ng-template #backTpl let-target="target">
        <button type="button" (click)="goto(target)" class="ad-back">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
      </ng-template>

      <ng-template #checkTpl let-active="active" let-gold="gold">
        <div class="ad-role-check" [class.ad-role-check--gold]="gold" [class.ad-role-check--visible]="active">
          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </ng-template>

      <ng-template #alertsTpl>
        @if (err()) {
          <div role="alert" class="ad-alert ad-alert--err">
            <svg class="ad-alert-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path stroke-linecap="round" d="M12 8v4M12 16h.01"/>
            </svg>
            {{ err() }}
          </div>
        }
        @if (ok()) {
          <div role="status" class="ad-alert ad-alert--ok">
            <svg class="ad-alert-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ ok() }}
          </div>
        }
      </ng-template>

    </div>
  `,
  styles: [`
    :host {
      --coral: #FF4433;
      --gold:  #F0B429;
      --bg:    #09090c;
      --bg2:   #111116;
      --text:  #F2EEE6;
      --muted: rgba(242,238,230,.42);
      --bdr:   rgba(242,238,230,.08);
      --bdrhi: rgba(242,238,230,.15);
      display: block;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .ad-shell {
      position: relative;
      width: 100%;
      background: var(--bg);
      color: var(--text);
      overflow: hidden;
      border-radius: 18px;
    }

    .ad-glow {
      pointer-events: none;
      position: absolute; top: -80px; left: -60px;
      width: 280px; height: 280px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,68,51,.07) 0%, transparent 70%);
      z-index: 0;
    }

    .ad-grain {
      pointer-events: none;
      position: absolute; inset: 0;
      opacity: .45; z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
    }

    .ad-close {
      position: absolute; top: 14px; right: 14px; z-index: 20;
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.05); border: none; cursor: pointer;
      color: rgba(255,255,255,.4);
      transition: background .15s, color .15s;
    }
    .ad-close:hover { background: rgba(255,255,255,.1); color: rgba(255,255,255,.75); }

    .ad-pane {
      position: relative; z-index: 1;
      display: flex; flex-direction: column; gap: 20px;
      padding: 24px 22px 28px;
      animation: fadeUp .28s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .ad-brand { display: flex; align-items: center; gap: 9px; }
    .ad-brand-ring {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      border: 1.5px solid rgba(255,68,51,.35); background: rgba(255,68,51,.08);
      color: var(--coral); display: flex; align-items: center; justify-content: center;
    }
    .ad-brand-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.15rem; letter-spacing: .08em; color: var(--text);
    }

    .ad-progress-wrap { display: flex; flex-direction: column; gap: 5px; }
    .ad-progress-track {
      width: 100%; height: 3px; border-radius: 99px;
      background: rgba(255,255,255,.06);
    }
    .ad-progress-fill {
      height: 100%; border-radius: 99px;
      background: var(--coral); transition: width .5s ease;
    }
    .ad-progress-fill--gold { background: var(--gold); }
    .ad-step-label {
      font-family: 'DM Mono', monospace;
      font-size: .57rem; letter-spacing: .14em; text-transform: uppercase;
      color: rgba(242,238,230,.3);
    }

    .ad-head { display: flex; flex-direction: column; gap: 5px; }
    .ad-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.9rem; letter-spacing: .04em; line-height: 1;
      margin: 0; color: var(--text);
    }
    .ad-sub  { font-size: .8rem; color: var(--muted); font-weight: 300; line-height: 1.65; margin: 0; }
    .ad-em   { color: var(--text); font-weight: 600; font-style: normal; }

    .ad-badge {
      display: inline-flex; align-items: center; width: fit-content;
      padding: 3px 10px; border-radius: 99px; margin-bottom: 4px;
      background: rgba(255,68,51,.1); border: 1px solid rgba(255,68,51,.25);
      font-family: 'DM Mono', monospace; font-size: .6rem;
      letter-spacing: .1em; text-transform: uppercase; color: var(--coral);
    }
    .ad-badge--gold { background: rgba(240,180,41,.1); border-color: rgba(240,180,41,.25); color: var(--gold); }

    .ad-roles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ad-role {
      position: relative;
      display: flex; flex-direction: column; align-items: center; gap: 9px;
      padding: 18px 14px 16px;
      background: var(--bg2); border: 1px solid var(--bdr); border-radius: 14px;
      cursor: pointer; text-align: center;
      transition: border-color .2s, background .2s, transform .18s, box-shadow .2s;
      -webkit-tap-highlight-color: transparent;
    }
    .ad-role:hover { border-color: var(--bdrhi); transform: translateY(-2px); }
    .ad-role--coral {
      border-color: rgba(255,68,51,.55) !important;
      background: rgba(255,68,51,.05) !important;
      box-shadow: 0 0 24px rgba(255,68,51,.12);
    }
    .ad-role--gold {
      border-color: rgba(240,180,41,.55) !important;
      background: rgba(240,180,41,.05) !important;
      box-shadow: 0 0 24px rgba(240,180,41,.1);
    }

    .ad-role-check {
      position: absolute; top: 8px; right: 8px;
      width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--coral); color: #fff;
      opacity: 0; transform: scale(.5);
      transition: opacity .2s, transform .2s;
    }
    .ad-role-check--gold    { background: var(--gold); color: #1a1200; }
    .ad-role-check--visible { opacity: 1; transform: scale(1); }

    .ad-role-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .ad-role-icon--coral { background: rgba(255,68,51,.1); border: 1px solid rgba(255,68,51,.18); color: var(--coral); }
    .ad-role-icon--gold  { background: rgba(240,180,41,.1); border: 1px solid rgba(240,180,41,.18); color: var(--gold); }

    .ad-role-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: .95rem; letter-spacing: .04em; color: var(--text);
    }
    .ad-role-hint { font-size: .66rem; color: var(--muted); font-weight: 300; line-height: 1.35; }

    .ad-verify-hero { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .ad-verify-orb {
      width: 64px; height: 64px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(240,180,41,.08); border: 1px solid rgba(240,180,41,.2);
      color: var(--gold);
    }

    .ad-form      { display: flex; flex-direction: column; gap: 13px; }
    .ad-field     { display: flex; flex-direction: column; gap: 6px; }
    .ad-row       { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ad-label-row { display: flex; align-items: center; justify-content: space-between; }
    .ad-label     { font-size: .72rem; font-weight: 600; color: rgba(242,238,230,.62); letter-spacing: .01em; }
    .ad-ferr      { font-size: .68rem; color: var(--coral); }

    .ad-input {
      width: 100%; box-sizing: border-box;
      background: var(--bg2) !important;
      border: 1px solid var(--bdr) !important;
      border-radius: 9px !important;
      color: var(--text) !important;
      font-family: 'Plus Jakarta Sans', sans-serif !important;
      font-size: .88rem !important;
      padding: .65rem .9rem !important;
      outline: none !important;
      transition: border-color .2s, box-shadow .2s !important;
    }
    .ad-input:focus {
      border-color: rgba(255,68,51,.5) !important;
      box-shadow: 0 0 0 3px rgba(255,68,51,.08) !important;
    }
    .ad-input::placeholder { color: rgba(242,238,230,.22) !important; }
    .ad-input--code {
      font-family: 'DM Mono', monospace !important;
      letter-spacing: .22em !important;
      font-size: 1.05rem !important;
      text-align: center !important;
    }

    .ad-cta {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      padding: .78rem 1rem .78rem 1.25rem; border: none; border-radius: 12px;
      background: var(--coral); color: #fff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700; font-size: .9rem;
      cursor: pointer; position: relative; overflow: hidden;
      box-shadow: 0 0 28px rgba(255,68,51,.22);
      transition: box-shadow .25s, transform .18s, opacity .2s;
    }
    .ad-cta::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.14) 0%, transparent 55%);
      pointer-events: none;
    }
    .ad-cta:hover:not(:disabled) { box-shadow: 0 0 48px rgba(255,68,51,.42); transform: translateY(-1px); }
    .ad-cta:disabled { opacity: .42; cursor: not-allowed; }
    .ad-cta--gold {
      background: var(--gold); color: #1a1200;
      box-shadow: 0 0 28px rgba(240,180,41,.22);
    }
    .ad-cta--gold:hover:not(:disabled) { box-shadow: 0 0 48px rgba(240,180,41,.42); }

    /* ── FIX: replaced flex+gap span with a plain class to avoid
       Tailwind utility classes (flex/items-center/gap-2) that may
       not be available inside a component shadow / encapsulation. ── */
    .ad-cta-label {
      display: flex; align-items: center; gap: 8px;
    }

    .ad-cta-arrow {
      width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.2); font-size: 1rem;
      transition: transform .2s;
    }
    .ad-cta:hover:not(:disabled) .ad-cta-arrow { transform: translateX(3px); }

    .ad-alert {
      display: flex; align-items: flex-start; gap: 8px;
      padding: .6rem .85rem; border-radius: 9px;
      font-size: .78rem; line-height: 1.5;
    }
    .ad-alert--err { background: rgba(255,68,51,.1); border: 1px solid rgba(255,68,51,.22); color: #ff7060; }
    .ad-alert--ok  { background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2);  color: #4ade80; }
    .ad-alert-icon { flex-shrink: 0; margin-top: 1px; }

    .ad-back {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: none; padding: 0; min-height: 28px;
      font-size: .74rem; font-weight: 500; color: var(--muted);
      cursor: pointer; width: fit-content;
      transition: color .2s;
    }
    .ad-back:hover { color: var(--text); }

    .ad-link {
      background: none; border: none; padding: 0;
      color: var(--coral); font-weight: 600;
      font-size: inherit; cursor: pointer;
      transition: opacity .2s;
    }
    .ad-link:hover { opacity: .75; }
    .ad-link--sm { font-size: .72rem; font-weight: 500; }

    .ad-footer-text { text-align: center; font-size: .78rem; color: var(--muted); }

    .ad-spin {
      display: inline-block; width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,.28); border-top-color: #fff;
      animation: spin .7s linear infinite;
    }
    .ad-spin--dark { border-color: rgba(0,0,0,.2); border-top-color: #1a1200; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 360px) { .ad-row { grid-template-columns: 1fr; } }
  `],
})
export class AuthDialog implements OnInit, OnDestroy {
  private readonly dialogRef = inject(ZardDialogRef);
  private readonly fb        = inject(FormBuilder);
  private readonly auth      = inject(AuthService);
  private readonly router    = inject(Router);

  private readonly dialogData: { mode?: 'login' | 'register' } =
    (inject(ZARD_DIALOG_DATA, { optional: true }) as any) ?? {};

  step         = signal<Step>('login-role-selection');
  regRole      = signal<UserRole>('user');
  loginRole    = signal<UserRole>('user');
  pendingEmail = signal('');
  busy         = signal(false);
  err          = signal('');
  ok           = signal('');

  registerForm!: FormGroup;
  verifyForm!:   FormGroup;
  loginForm!:    FormGroup;
  forgotForm!:   FormGroup;
  resetForm!:    FormGroup;

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.buildForms();
    this.step.set(this.dialogData?.mode === 'register' ? 'role-selection' : 'login-role-selection');
  }

  ngOnDestroy() { this.timers.forEach(clearTimeout); }

  close() { this.dialogRef.close(); }

  private after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
  }

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
    const prev = this.registerForm?.value ?? {};
    this.registerForm = this.regRole() === 'organizer'
      ? this.fb.group({
          name:     [prev.name     ?? '', [Validators.required, Validators.minLength(2)]],
          email:    [prev.email    ?? '', [Validators.required, Validators.email]],
          password: [prev.password ?? '', [Validators.required, Validators.minLength(6)]],
        })
      : this.fb.group({
          firstName: [prev.firstName ?? '', Validators.required],
          lastName:  [prev.lastName  ?? '', Validators.required],
          email:     [prev.email     ?? '', [Validators.required, Validators.email]],
          password:  [prev.password  ?? '', [Validators.required, Validators.minLength(6)]],
        });
  }

  f(name: string) { return this.registerForm.get(name)!; }
  goto(s: Step)   { this.step.set(s); this.err.set(''); this.ok.set(''); }
  private clear() { this.err.set(''); this.ok.set(''); }

  selectRegRole(r: UserRole) {
    this.regRole.set(r);
    this.buildRegisterForm();
    this.goto('register');
  }

  selectLoginRole(r: UserRole) {
    this.loginRole.set(r);
    this.goto('login');
  }

  /* ── Register ── */
  onRegister() {
    if (this.registerForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    this.auth.register(this.registerForm.value as RegisterDto, this.regRole()).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          const email = this.registerForm.get('email')!.value;
          this.pendingEmail.set(email);
          if (this.regRole() === 'user') {
            this.ok.set('Account created! Check your email for the verification code.');
            this.after(1200, () => this.goto('verify'));
          } else {
            this.ok.set('Organizer account created! Please sign in.');
            this.after(1500, () => {
              this.loginRole.set('organizer');
              this.loginForm.patchValue({ email });
              this.goto('login');
            });
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
    const dto: VerifyAccountDto = {
      email: this.pendingEmail(),
      code:  this.verifyForm.get('code')!.value,
    };
    this.auth.verifyAccount(dto).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Email verified! Redirecting to sign in…');
          this.after(1200, () => {
            this.loginRole.set('user');
            this.loginForm.patchValue({ email: this.pendingEmail() });
            this.goto('login');
          });
        } else { this.err.set(r.message || 'Verification failed'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Invalid or expired code'); },
    });
  }

  /* ── Login ── */
  onLogin() {
    if (this.loginForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    const role = this.loginRole();
    this.auth.login(this.loginForm.value as LoginDto, role).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          if (role === 'user') {
            this.ok.set('Welcome! Setting up your feed…');
            this.after(700, () => { this.dialogRef.close(); this.router.navigate(['/select-categories']); });
          } else {
            this.ok.set('Welcome back! Redirecting…');
            this.after(900, () => { this.dialogRef.close(); this.router.navigate(['/dashboard']); });
          }
        } else { this.err.set(r.message || 'Login failed'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Login failed'); },
    });
  }

  /* ── Forgot ── */
  onForgot() {
    if (this.forgotForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    this.auth.forgotPassword(this.forgotForm.value, this.loginRole()).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Reset link sent! Check your inbox.');
          this.after(2500, () => {
            this.resetForm.patchValue({ email: this.forgotForm.get('email')!.value });
            this.goto('reset-password');
          });
        } else { this.err.set(r.message || 'Failed to send reset link'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Failed'); },
    });
  }

  /* ── Reset ── */
  onReset() {
    if (this.resetForm.invalid || this.busy()) return;
    this.busy.set(true); this.clear();
    this.auth.resetPassword(this.resetForm.value, this.loginRole()).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.ok.set('Password reset! You can now sign in.');
          this.after(2000, () => {
            this.loginForm.patchValue({ email: this.resetForm.get('email')!.value });
            this.goto('login');
          });
        } else { this.err.set(r.message || 'Reset failed'); }
      },
      error: e => { this.busy.set(false); this.err.set(e?.error?.message || 'Reset failed'); },
    });
  }
}