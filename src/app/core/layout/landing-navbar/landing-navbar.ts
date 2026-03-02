// src/app/core/layout/landing-navbar/landing-navbar.ts
import { Component, inject, HostListener, signal } from '@angular/core';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { AuthDialog } from '@features/auth/auth-dialog/auth-dialog';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />

    <nav class="es-nav" [class.es-nav--scrolled]="scrolled()">
      <div class="es-nav__inner max-w-screen-xl mx-auto px-5 sm:px-8 lg:px-12">

        <!-- Logo -->
        <a href="/" class="es-nav__logo">Eventsora</a>

        <!-- CTA -->
        <button class="es-nav__cta" (click)="openGetStartedDialog()">
          Get Started
          <span class="es-nav__cta-arrow">→</span>
        </button>

      </div>
    </nav>
  `,
  styles: [`
    :host {
      --coral:  #FF4433;
      --bg:     #060608;
      --text:   #F2EEE6;
      --border: rgba(242,238,230,0.08);
      --fd: 'Bebas Neue', sans-serif;
      --fb: 'Plus Jakarta Sans', sans-serif;
      display: block;
    }

    .es-nav {
      width: 100%;
      padding: 1.25rem 0;
      background: transparent;
      transition: background .35s, border-color .35s, padding .35s, backdrop-filter .35s;
      border-bottom: 1px solid transparent;
    }

    .es-nav--scrolled {
      background: rgba(6, 6, 8, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom-color: var(--border);
      padding: .85rem 0;
    }

    .es-nav__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Logo */
    .es-nav__logo {
      font-family: var(--fd);
      font-size: 1.65rem;
      letter-spacing: .06em;
      color: var(--text);
      text-decoration: none;
      transition: color .2s;
      line-height: 1;
    }
    .es-nav__logo:hover { color: var(--coral); }

    /* CTA button */
    .es-nav__cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: .55rem 1.35rem;
      background: var(--coral);
      color: #fff;
      border: none;
      border-radius: 100px;
      font-family: var(--fb);
      font-weight: 700;
      font-size: .85rem;
      letter-spacing: .03em;
      cursor: pointer;
      transition: box-shadow .25s, transform .18s;
      box-shadow: 0 0 24px rgba(255, 68, 51, .25);
      position: relative;
      overflow: hidden;
    }
    .es-nav__cta::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.14) 0%, transparent 55%);
      pointer-events: none;
    }
    .es-nav__cta:hover {
      box-shadow: 0 0 44px rgba(255, 68, 51, .45);
      transform: translateY(-1px);
    }
    .es-nav__cta-arrow {
      transition: transform .22s;
      font-size: .9rem;
    }
    .es-nav__cta:hover .es-nav__cta-arrow {
      transform: translateX(3px);
    }
  `],
})
export class LandingNavbar {
  private readonly dialogService = inject(ZardDialogService);

  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  openGetStartedDialog(): void {
    this.dialogService.create({
      zContent: AuthDialog,
      zWidth: '425px',
    });
  }
}