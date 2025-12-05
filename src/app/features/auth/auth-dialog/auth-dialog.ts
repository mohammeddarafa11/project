// auth-dialog.component.ts
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
import {
  AuthService,
  UserRole,
  RegisterDto,
  OrgRegisterDto,
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
  ],
  template: `
    <!-- WELCOME SCREEN -->
    @if (step() === 'welcome') {
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-2">Get Started</h2>
      <p class="text-muted-foreground mb-6">
        Create your account to start building amazing events.
      </p>

      <div class="space-y-3">
        <button
          z-button
          zType="default"
          class="w-full"
          (click)="goToRoleSelection()"
        >
          Sign Up
        </button>

        <button z-button zType="outline" class="w-full" (click)="goToLogin()">
          Login
        </button>
      </div>

      <z-divider zSpacing="sm" class="my-4" />

      <p class="text-sm text-center text-muted-foreground">
        Free 14-day trial, no credit card required.
      </p>
    </div>
    }

    <!-- ROLE SELECTION -->
    @if (step() === 'role-selection') {
    <div class="p-6">
      <button
        z-button
        zType="ghost"
        class="mb-4 -ml-2"
        (click)="backToWelcome()"
      >
        ← Back
      </button>

      <h2 class="text-2xl font-bold mb-2">Choose Your Role</h2>
      <p class="text-muted-foreground mb-6">
        Select how you want to use Eventora
      </p>

      <div class="grid grid-cols-2 gap-4">
        <!-- Organizer -->
        <div
          class="border rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-primary transition-all"
          (click)="selectRole('organizer')"
        >
          <div class="flex flex-col items-center text-center space-y-3">
            <div
              class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold">Organizer</h3>
            <p class="text-xs text-muted-foreground">
              Create and manage events
            </p>
          </div>
        </div>

        <!-- Attendee -->
        <div
          class="border rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-primary transition-all"
          (click)="selectRole('user')"
        >
          <div class="flex flex-col items-center text-center space-y-3">
            <div
              class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold">Attendee</h3>
            <p class="text-xs text-muted-foreground">
              Discover and join events
            </p>
          </div>
        </div>
      </div>

      <div class="text-center mt-6">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <a
            (click)="goToLogin()"
            class="text-primary hover:underline cursor-pointer font-medium"
          >
            Login
          </a>
        </p>
      </div>
    </div>
    }

    <!-- REGISTER -->
    @if (step() === 'register') {
    <div class="p-6">
      <button
        z-button
        zType="ghost"
        class="mb-4 -ml-2"
        (click)="backToRoleSelection()"
      >
        ← Back
      </button>

      <h2 class="text-2xl font-bold mb-2">
        Register as
        {{ selectedRole() === 'organizer' ? 'Organizer' : 'Attendee' }}
      </h2>
      <p class="text-muted-foreground mb-6">
        Create your account to get started
      </p>

      <form
        [formGroup]="registerForm"
        (ngSubmit)="onRegister()"
        class="space-y-4"
      >
        @if (selectedRole() === 'organizer') {
        <div>
          <label class="text-sm font-medium mb-1.5 block"
            >Organization Name</label
          >
          <input
            z-input
            formControlName="name"
            type="text"
            placeholder="Enter organization name"
            class="w-full"
          />
          @if (registerForm.get('name')?.invalid &&
          registerForm.get('name')?.touched) {
          <p class="text-xs text-destructive mt-1">
            Organization name is required
          </p>
          }
        </div>
        } @else {
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">First Name</label>
            <input
              z-input
              formControlName="firstName"
              type="text"
              placeholder="First name"
              class="w-full"
            />
            @if (registerForm.get('firstName')?.invalid &&
            registerForm.get('firstName')?.touched) {
            <p class="text-xs text-destructive mt-1">Required</p>
            }
          </div>
          <div>
            <label class="text-sm font-medium mb-1.5 block">Last Name</label>
            <input
              z-input
              formControlName="lastName"
              type="text"
              placeholder="Last name"
              class="w-full"
            />
            @if (registerForm.get('lastName')?.invalid &&
            registerForm.get('lastName')?.touched) {
            <p class="text-xs text-destructive mt-1">Required</p>
            }
          </div>
        </div>
        }

        <div>
          <label class="text-sm font-medium mb-1.5 block">Email</label>
          <input
            z-input
            formControlName="email"
            type="email"
            placeholder="Enter your email"
            class="w-full"
          />
          @if (registerForm.get('email')?.invalid &&
          registerForm.get('email')?.touched) {
          <p class="text-xs text-destructive mt-1">Valid email is required</p>
          }
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">Password</label>
          <input
            z-input
            formControlName="password"
            type="password"
            placeholder="Create a password"
            class="w-full"
          />
          @if (registerForm.get('password')?.invalid &&
          registerForm.get('password')?.touched) {
          <p class="text-xs text-destructive mt-1">
            Password must be at least 6 characters
          </p>
          }
        </div>

        @if (errorMessage()) {
        <div
          class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
        >
          {{ errorMessage() }}
        </div>
        }

        <button
          z-button
          zType="default"
          type="submit"
          class="w-full"
          [disabled]="registerForm.invalid || isSubmitting()"
        >
          {{ isSubmitting() ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="text-center mt-4">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <a
            (click)="goToLogin()"
            class="text-primary hover:underline cursor-pointer font-medium"
          >
            Login
          </a>
        </p>
      </div>
    </div>
    }

    <!-- LOGIN -->
    @if (step() === 'login') {
    <div class="p-6">
      <button
        z-button
        zType="ghost"
        class="mb-4 -ml-2"
        (click)="backToWelcome()"
      >
        ← Back
      </button>

      <h2 class="text-2xl font-bold mb-2">Login to your account</h2>
      <p class="text-muted-foreground mb-6">
        Enter your credentials to access your account
      </p>

      <!-- <div class="flex gap-2 mb-6">
        <button
          z-button
          [zType]="loginRole() === 'user' ? 'default' : 'outline'"
          class="flex-1"
          (click)="setLoginRole('user')"
        >
          Attendee
        </button>
        <button
          z-button
          [zType]="loginRole() === 'organizer' ? 'default' : 'outline'"
          class="flex-1"
          (click)="setLoginRole('organizer')"
        >
          Organizer
        </button>
      </div> -->

      <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-1.5 block">Email</label>
          <input
            z-input
            formControlName="email"
            type="email"
            placeholder="Enter your email"
            class="w-full"
          />
          @if (loginForm.get('email')?.invalid &&
          loginForm.get('email')?.touched) {
          <p class="text-xs text-destructive mt-1">Valid email is required</p>
          }
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium">Password</label>
            <a
              (click)="goToForgotPassword()"
              class="text-xs text-primary hover:underline cursor-pointer"
              >Forgot password?</a
            >
          </div>
          <input
            z-input
            formControlName="password"
            type="password"
            placeholder="Enter your password"
            class="w-full"
          />
          @if (loginForm.get('password')?.invalid &&
          loginForm.get('password')?.touched) {
          <p class="text-xs text-destructive mt-1">Password is required</p>
          }
        </div>

        @if (errorMessage()) {
        <div
          class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
        >
          {{ errorMessage() }}
        </div>
        }

        <button
          z-button
          zType="default"
          type="submit"
          class="w-full"
          [disabled]="loginForm.invalid || isSubmitting()"
        >
          {{ isSubmitting() ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="text-center mt-4">
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <a
            (click)="goToRoleSelection()"
            class="text-primary hover:underline cursor-pointer font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
    }

    <!-- FORGOT PASSWORD -->
    @if (step() === 'forgot-password') {
    <div class="p-6">
      <button
        z-button
        zType="ghost"
        class="mb-4 -ml-2"
        (click)="backToLogin()"
      >
        ← Back
      </button>

      <h2 class="text-2xl font-bold mb-2">Forgot Password</h2>
      <p class="text-muted-foreground mb-6">
        Enter your email to receive password reset instructions
      </p>

      <form
        [formGroup]="forgotPasswordForm"
        (ngSubmit)="onForgotPassword()"
        class="space-y-4"
      >
        <div>
          <label class="text-sm font-medium mb-1.5 block">Email</label>
          <input
            z-input
            formControlName="email"
            type="email"
            placeholder="Enter your email"
            class="w-full"
          />
          @if (forgotPasswordForm.get('email')?.invalid &&
          forgotPasswordForm.get('email')?.touched) {
          <p class="text-xs text-destructive mt-1">Valid email is required</p>
          }
        </div>

        @if (errorMessage()) {
        <div
          class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
        >
          {{ errorMessage() }}
        </div>
        }

        @if (successMessage()) {
        <div
          class="bg-green-50 text-green-800 text-sm p-3 rounded-md border border-green-200"
        >
          {{ successMessage() }}
        </div>
        }

        <button
          z-button
          zType="default"
          type="submit"
          class="w-full"
          [disabled]="forgotPasswordForm.invalid || isSubmitting()"
        >
          {{ isSubmitting() ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
    </div>
    }

    <!-- RESET PASSWORD -->
    @if (step() === 'reset-password') {
    <div class="p-6">
      <button
        z-button
        zType="ghost"
        class="mb-4 -ml-2"
        (click)="backToLogin()"
      >
        ← Back
      </button>

      <h2 class="text-2xl font-bold mb-2">Reset Password</h2>
      <p class="text-muted-foreground mb-6">
        Enter your new password and reset token
      </p>

      <form
        [formGroup]="resetPasswordForm"
        (ngSubmit)="onResetPassword()"
        class="space-y-4"
      >
        <div>
          <label class="text-sm font-medium mb-1.5 block">Email</label>
          <input
            z-input
            formControlName="email"
            type="email"
            placeholder="Enter your email"
            class="w-full"
          />
          @if (resetPasswordForm.get('email')?.invalid &&
          resetPasswordForm.get('email')?.touched) {
          <p class="text-xs text-destructive mt-1">Valid email is required</p>
          }
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">Reset Token</label>
          <input
            z-input
            formControlName="token"
            type="text"
            placeholder="Enter reset token from email"
            class="w-full"
          />
          @if (resetPasswordForm.get('token')?.invalid &&
          resetPasswordForm.get('token')?.touched) {
          <p class="text-xs text-destructive mt-1">Token is required</p>
          }
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">New Password</label>
          <input
            z-input
            formControlName="newPassword"
            type="password"
            placeholder="Enter new password"
            class="w-full"
          />
          @if (resetPasswordForm.get('newPassword')?.invalid &&
          resetPasswordForm.get('newPassword')?.touched) {
          <p class="text-xs text-destructive mt-1">
            Password must be at least 6 characters
          </p>
          }
        </div>

        @if (errorMessage()) {
        <div
          class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
        >
          {{ errorMessage() }}
        </div>
        }

        @if (successMessage()) {
        <div
          class="bg-green-50 text-green-800 text-sm p-3 rounded-md border border-green-200"
        >
          {{ successMessage() }}
        </div>
        }

        <button
          z-button
          zType="default"
          type="submit"
          class="w-full"
          [disabled]="resetPasswordForm.invalid || isSubmitting()"
        >
          {{ isSubmitting() ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
    }
  `,
})
export class AuthDialog {
  private readonly dialogRef = inject(ZardDialogRef);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  step = signal<DialogStep>('welcome');
  selectedRole = signal<UserRole>('user');
  loginRole = signal<UserRole>('user');
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  registerForm!: FormGroup;
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.buildRegisterForm();
  }

  private buildRegisterForm(): void {
    if (this.selectedRole() === 'organizer') {
      this.registerForm = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phoneNumber: [''],
        city: [''],
        region: [''],
        bio: [''],
        logoUrl: [''],
        coverUrl: [''],
      });
    } else {
      this.registerForm = this.fb.group({
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phoneNumber: [''],
        city: [''],
        region: [''],
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  goToRoleSelection(): void {
    this.step.set('role-selection');
    this.clearMessages();
  }

  goToLogin(): void {
    this.step.set('login');
    this.loginForm.reset();
    this.clearMessages();
  }

  backToWelcome(): void {
    this.step.set('welcome');
    this.clearMessages();
  }

  backToRoleSelection(): void {
    this.step.set('role-selection');
    this.clearMessages();
  }

  backToLogin(): void {
    this.step.set('login');
    this.clearMessages();
  }

  goToForgotPassword(): void {
    this.step.set('forgot-password');
    this.forgotPasswordForm.reset();
    this.clearMessages();
  }

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.buildRegisterForm();
    this.step.set('register');
    this.clearMessages();
  }

  setLoginRole(role: UserRole): void {
    this.loginRole.set(role);
    this.clearMessages();
  }

  onRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();
    const role = this.selectedRole();
    const formValue = this.registerForm.value;

    this.authService.register(formValue, role).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.loginRole.set(role);
        this.loginForm.patchValue({ email: formValue.email });
        this.step.set('login');
        this.successMessage.set(
          'Account created successfully! Please log in.'
        );
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg =
          err?.error?.message ||
          err?.error?.title ||
          'Registration failed. Please try again.';
        this.errorMessage.set(errorMsg);
      },
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    const role = this.loginRole();
    const payload: LoginDto = this.loginForm.value;

    this.authService.login(payload, role).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.authService.setAuthData(res, role);
        this.dialogRef.close();

        if (role === 'user') {
          alert(
            'Please use the Eventora mobile app to access your attendee account.'
          );
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg =
          err?.error?.message ||
          err?.error?.title ||
          'Login failed. Please check your credentials.';
        this.errorMessage.set(errorMsg);
      },
    });
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    const payload: ForgotPasswordDto = this.forgotPasswordForm.value;
    const role = this.loginRole();

    this.authService.forgotPassword(payload, role).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          'Password reset link sent to your email. Check your inbox.'
        );
        setTimeout(() => {
          this.step.set('reset-password');
          this.resetPasswordForm.patchValue({ email: payload.email });
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg =
          err?.error?.message ||
          err?.error?.title ||
          'Failed to send reset link. Please try again.';
        this.errorMessage.set(errorMsg);
      },
    });
  }

  onResetPassword(): void {
    if (this.resetPasswordForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    const payload: ResetPasswordDto = this.resetPasswordForm.value;
    const role = this.loginRole();

    this.authService.resetPassword(payload, role).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Password reset successfully! You can now login.');
        setTimeout(() => {
          this.step.set('login');
          this.loginForm.reset();
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg =
          err?.error?.message ||
          err?.error?.title ||
          'Password reset failed. Please try again.';
        this.errorMessage.set(errorMsg);
      },
    });
  }
}
