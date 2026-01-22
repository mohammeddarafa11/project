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
    <!-- WELCOME SCREEN -->
    @if (step() === 'welcome') {
      <div class="p-6">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <z-icon [zType]="icons.calendar" class="w-8 h-8 text-primary" />
          </div>
          <h2 class="text-2xl font-bold mb-2">Get Started with Eventora</h2>
          <p class="text-muted-foreground">
            Create your account to start building amazing events.
          </p>
        </div>

        <div class="space-y-3">
          <button
            z-button
            zType="default"
            class="w-full"
            (click)="goToRoleSelection()"
          >
            <z-icon [zType]="icons.userPlus" class="mr-2 w-4 h-4" />
            Sign Up
          </button>

          <button z-button zType="outline" class="w-full" (click)="goToLogin()">
            <z-icon [zType]="icons.logIn" class="mr-2 w-4 h-4" />
            Organizer Login
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
          <z-icon [zType]="icons.arrowLeft" class="mr-2 w-4 h-4" />
          Back
        </button>

        <h2 class="text-2xl font-bold mb-2">Choose Your Role</h2>
        <p class="text-muted-foreground mb-6">
          Select how you want to use Eventora
        </p>

        <div class="grid grid-cols-2 gap-4">
          <!-- Organizer -->
          <div
            class="border rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-primary transition-all"
            [class.border-primary]="selectedRole() === 'organizer'"
            [class.bg-primary/5]="selectedRole() === 'organizer'"
            (click)="selectRole('organizer')"
          >
            <div class="flex flex-col items-center text-center space-y-3">
              <div
                class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <z-icon
                  [zType]="icons.briefcase"
                  class="w-10 h-10 text-primary"
                />
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
            [class.border-primary]="selectedRole() === 'user'"
            [class.bg-primary/5]="selectedRole() === 'user'"
            (click)="selectRole('user')"
          >
            <div class="flex flex-col items-center text-center space-y-3">
              <div
                class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <z-icon [zType]="icons.user" class="w-10 h-10 text-primary" />
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
            Already have an organizer account?
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
          <z-icon [zType]="icons.arrowLeft" class="mr-2 w-4 h-4" />
          Back
        </button>

        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">
            Register as
            {{ selectedRole() === 'organizer' ? 'Organizer' : 'Attendee' }}
          </h2>
          <p class="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <form
          [formGroup]="registerForm"
          (ngSubmit)="onRegister()"
          class="space-y-4"
        >
          @if (selectedRole() === 'organizer') {
            <div>
              <label class="text-sm font-medium mb-1.5 block">
                Organization Name <span class="text-destructive">*</span>
              </label>
              <input
                z-input
                formControlName="name"
                type="text"
                placeholder="Enter organization name"
                class="w-full"
              />
              @if (
                registerForm.get('name')?.invalid &&
                registerForm.get('name')?.touched
              ) {
                <p class="text-xs text-destructive mt-1">
                  Organization name is required
                </p>
              }
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium mb-1.5 block">
                  First Name <span class="text-destructive">*</span>
                </label>
                <input
                  z-input
                  formControlName="firstName"
                  type="text"
                  placeholder="First name"
                  class="w-full"
                />
                @if (
                  registerForm.get('firstName')?.invalid &&
                  registerForm.get('firstName')?.touched
                ) {
                  <p class="text-xs text-destructive mt-1">Required</p>
                }
              </div>
              <div>
                <label class="text-sm font-medium mb-1.5 block">
                  Last Name <span class="text-destructive">*</span>
                </label>
                <input
                  z-input
                  formControlName="lastName"
                  type="text"
                  placeholder="Last name"
                  class="w-full"
                />
                @if (
                  registerForm.get('lastName')?.invalid &&
                  registerForm.get('lastName')?.touched
                ) {
                  <p class="text-xs text-destructive mt-1">Required</p>
                }
              </div>
            </div>
          }

          <div>
            <label class="text-sm font-medium mb-1.5 block">
              Email <span class="text-destructive">*</span>
            </label>
            <input
              z-input
              formControlName="email"
              type="email"
              placeholder="Enter your email"
              class="w-full"
            />
            @if (
              registerForm.get('email')?.invalid &&
              registerForm.get('email')?.touched
            ) {
              <p class="text-xs text-destructive mt-1">
                Valid email is required
              </p>
            }
          </div>

          <div>
            <label class="text-sm font-medium mb-1.5 block">
              Password <span class="text-destructive">*</span>
            </label>
            <input
              z-input
              formControlName="password"
              type="password"
              placeholder="Create a password (min. 6 characters)"
              class="w-full"
            />
            @if (
              registerForm.get('password')?.invalid &&
              registerForm.get('password')?.touched
            ) {
              <p class="text-xs text-destructive mt-1">
                Password must be at least 6 characters
              </p>
            }
          </div>

          @if (errorMessage()) {
            <div
              class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
            >
              <z-icon [zType]="icons.alertCircle" class="w-4 h-4 inline mr-2" />
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div
              class="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 text-sm p-3 rounded-md border border-green-200 dark:border-green-800"
            >
              <z-icon [zType]="icons.checkCircle" class="w-4 h-4 inline mr-2" />
              {{ successMessage() }}
            </div>
          }

          <button
            z-button
            zType="default"
            type="submit"
            class="w-full"
            [disabled]="registerForm.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <z-icon
                [zType]="icons.loader"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Creating Account...
            } @else {
              Create Account
            }
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

    <!-- LOGIN (ORGANIZER ONLY) -->
    @if (step() === 'login') {
      <div class="p-6">
        <button
          z-button
          zType="ghost"
          class="mb-4 -ml-2"
          (click)="backToWelcome()"
        >
          <z-icon [zType]="icons.arrowLeft" class="mr-2 w-4 h-4" />
          Back
        </button>

        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Organizer Login</h2>
          <p class="text-muted-foreground">
            Login to access your event management dashboard
          </p>
        </div>

        <!-- Info Banner -->
        <div
          class="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md"
        >
          <div class="flex items-start gap-2">
            <z-icon
              [zType]="icons.alertCircle"
              class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
            />
            <p class="text-xs text-blue-800 dark:text-blue-300">
              Only organizers can login to the dashboard. Attendees can browse
              and join events without logging in.
            </p>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-1.5 block">Email</label>
            <input
              z-input
              formControlName="email"
              type="email"
              placeholder="Enter your organization email"
              class="w-full"
            />
            @if (
              loginForm.get('email')?.invalid && loginForm.get('email')?.touched
            ) {
              <p class="text-xs text-destructive mt-1">
                Valid email is required
              </p>
            }
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-medium">Password</label>
              <a
                (click)="goToForgotPassword()"
                class="text-xs text-primary hover:underline cursor-pointer"
              >
                Forgot password?
              </a>
            </div>
            <input
              z-input
              formControlName="password"
              type="password"
              placeholder="Enter your password"
              class="w-full"
            />
            @if (
              loginForm.get('password')?.invalid &&
              loginForm.get('password')?.touched
            ) {
              <p class="text-xs text-destructive mt-1">Password is required</p>
            }
          </div>

          @if (errorMessage()) {
            <div
              class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
            >
              <z-icon [zType]="icons.alertCircle" class="w-4 h-4 inline mr-2" />
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div
              class="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 text-sm p-3 rounded-md border border-green-200 dark:border-green-800"
            >
              <z-icon [zType]="icons.checkCircle" class="w-4 h-4 inline mr-2" />
              {{ successMessage() }}
            </div>
          }

          <button
            z-button
            zType="default"
            type="submit"
            class="w-full"
            [disabled]="loginForm.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <z-icon
                [zType]="icons.loader"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Logging in...
            } @else {
              <z-icon [zType]="icons.briefcase" class="mr-2 w-4 h-4" />
              Login as Organizer
            }
          </button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-muted-foreground">
            Don't have an organizer account?
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
          <z-icon [zType]="icons.arrowLeft" class="mr-2 w-4 h-4" />
          Back
        </button>

        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Forgot Password</h2>
          <p class="text-muted-foreground">
            Enter your email to receive password reset instructions
          </p>
        </div>

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
            @if (
              forgotPasswordForm.get('email')?.invalid &&
              forgotPasswordForm.get('email')?.touched
            ) {
              <p class="text-xs text-destructive mt-1">
                Valid email is required
              </p>
            }
          </div>

          @if (errorMessage()) {
            <div
              class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
            >
              <z-icon [zType]="icons.alertCircle" class="w-4 h-4 inline mr-2" />
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div
              class="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 text-sm p-3 rounded-md border border-green-200 dark:border-green-800"
            >
              <z-icon [zType]="icons.checkCircle" class="w-4 h-4 inline mr-2" />
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
            @if (isSubmitting()) {
              <z-icon
                [zType]="icons.loader"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Sending...
            } @else {
              <z-icon [zType]="icons.mail" class="w-4 h-4 mr-2" />
              Send Reset Link
            }
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
          <z-icon [zType]="icons.arrowLeft" class="mr-2 w-4 h-4" />
          Back
        </button>

        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Reset Password</h2>
          <p class="text-muted-foreground">
            Enter your new password and the reset token from your email
          </p>
        </div>

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
          </div>

          <div>
            <label class="text-sm font-medium mb-1.5 block">New Password</label>
            <input
              z-input
              formControlName="newPassword"
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              class="w-full"
            />
          </div>

          @if (errorMessage()) {
            <div
              class="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
            >
              <z-icon [zType]="icons.alertCircle" class="w-4 h-4 inline mr-2" />
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div
              class="bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 text-sm p-3 rounded-md border border-green-200 dark:border-green-800"
            >
              <z-icon [zType]="icons.checkCircle" class="w-4 h-4 inline mr-2" />
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
            @if (isSubmitting()) {
              <z-icon
                [zType]="icons.loader"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Resetting...
            } @else {
              <z-icon [zType]="icons.key" class="w-4 h-4 mr-2" />
              Reset Password
            }
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
  loginRole = signal<UserRole>('organizer'); // Always organizer for login
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Icons
  readonly icons = {
    calendar: 'calendar' as ZardIcon,
    userPlus: 'user-plus' as ZardIcon,
    logIn: 'log-in' as ZardIcon,
    arrowLeft: 'arrow-left' as ZardIcon,
    briefcase: 'briefcase' as ZardIcon,
    user: 'user' as ZardIcon,
    alertCircle: 'alert-circle' as ZardIcon,
    checkCircle: 'check-circle' as ZardIcon,
    loader: 'loader' as ZardIcon,
    mail: 'mail' as ZardIcon,
    key: 'key' as ZardIcon,
  };

  registerForm!: FormGroup;
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  constructor() {
    this.initForms();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['test@acmedigital.com', [Validators.required, Validators.email]],
      password: ['TestPass123!', [Validators.required]],
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
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    } else {
      this.registerForm = this.fb.group({
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
      });
    }
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // Navigation methods
  goToRoleSelection(): void {
    this.step.set('role-selection');
    this.clearMessages();
  }

  goToLogin(): void {
    this.step.set('login');
    this.loginForm.reset();
    this.loginRole.set('organizer'); // Always organizer
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
    this.forgotPasswordForm.patchValue({
      email: this.loginForm.get('email')?.value || '',
    });
    this.clearMessages();
  }

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.buildRegisterForm();
    this.step.set('register');
    this.clearMessages();
  }

  // Form submissions
  onRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    const formValue: RegisterDto = this.registerForm.value;
    const role = this.selectedRole();

    console.log(`📝 Registering ${role}:`, formValue.email);

    this.authService.register(formValue, role).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);

        console.log('✅ Registration response:', response);

        if (response.success) {
          // Different messages based on role
          if (role === 'organizer') {
            this.successMessage.set(
              'Organizer account created! You can now login to manage events.',
            );
            this.loginForm.patchValue({
              email: formValue.email,
              password: formValue.password,
            });
            this.loginRole.set('organizer');
          } else {
            this.successMessage.set(
              'Account created! You can now browse and join events.',
            );
          }

          setTimeout(() => {
            if (role === 'organizer') {
              this.step.set('login');
            } else {
              // Close dialog for attendees (they don't need to login)
              this.dialogRef.close();
            }
            this.clearMessages();
          }, 2000);
        } else {
          this.errorMessage.set(response.message || 'Registration failed');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.message || 'Registration failed. Please try again.',
        );
        console.error('❌ Registration error:', err);
      },
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.clearMessages();

    const payload: LoginDto = this.loginForm.value;

    console.log('🔐 Organizer login attempt:', payload.email);

    // Always login as organizer
    this.authService.login(payload, 'organizer').subscribe({
      next: (response) => {
        this.isSubmitting.set(false);

        console.log('✅ Login response:', response);

        const hasToken =
          typeof response.data === 'string'
            ? response.data
            : response.data?.token || response.token;

        if (response.success && hasToken) {
          this.successMessage.set(
            'Login successful! Redirecting to dashboard...',
          );

          setTimeout(() => {
            this.dialogRef.close();
            this.router.navigate(['/dashboard']);
          }, 1000);
        } else {
          this.errorMessage.set(
            response.message || 'Login failed - no token received',
          );
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);

        let errorMsg =
          err.error?.message || 'Login failed. Please check your credentials.';

        if (errorMsg.includes('Invalid') || errorMsg.includes('password')) {
          errorMsg +=
            ' Make sure you registered as an Organizer and are using the correct credentials.';
        }

        this.errorMessage.set(errorMsg);
        console.error('❌ Login error:', err);
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
          this.successMessage.set(
            'Password reset link sent to your email. Check your inbox.',
          );

          setTimeout(() => {
            this.step.set('reset-password');
            this.resetPasswordForm.patchValue({ email: payload.email });
            this.clearMessages();
          }, 2500);
        } else {
          this.errorMessage.set(
            response.message || 'Failed to send reset link',
          );
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.message || 'Failed to send reset link. Please try again.',
        );
        console.error('❌ Forgot password error:', err);
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
          this.successMessage.set(
            'Password reset successfully! You can now login.',
          );

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
        this.errorMessage.set(
          err.error?.message ||
            'Password reset failed. Please check your token.',
        );
        console.error('❌ Reset password error:', err);
      },
    });
  }
}
