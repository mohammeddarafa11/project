// src/app/features/auth/category-select-sheet/category-select-sheet.ts
//
// Only shown ONCE — if the user already has saved category IDs we close
// immediately so they are never prompted again on subsequent logins.
//
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ZardDialogRef } from '@shared/components/dialog/dialog-ref';
import { CategoryService, Category } from '@core/services/category';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';

const PALETTE = [
  { bg: '#1DB954', fg: '#052e12' },
  { bg: '#FF4433', fg: '#fff'    },
  { bg: '#F0B429', fg: '#1a0f00' },
  { bg: '#a78bfa', fg: '#160a30' },
  { bg: '#0ea5e9', fg: '#001c2e' },
  { bg: '#f97316', fg: '#1e0700' },
  { bg: '#ec4899', fg: '#200010' },
  { bg: '#84cc16', fg: '#0f1800' },
  { bg: '#6366f1', fg: '#0a0b20' },
  { bg: '#14b8a6', fg: '#001a18' },
  { bg: '#ef4444', fg: '#fff'    },
  { bg: '#d946ef', fg: '#1a0018' },
  { bg: '#f59e0b', fg: '#1a0d00' },
  { bg: '#22d3ee', fg: '#00171c' },
  { bg: '#4ade80', fg: '#011a07' },
  { bg: '#fb7185', fg: '#1a0008' },
];

@Component({
  selector: 'app-category-select-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

    <div class="cs-sheet">
      <div class="cs-handle" aria-hidden="true"></div>

      <div class="cs-header">
        <div class="cs-header-text">
          <h2 class="cs-title">What are you<br/><span class="cs-accent">into?</span></h2>
          <p class="cs-sub">Choose at least one genre. We'll build your personal event feed.</p>
        </div>
        @if (selected().size > 0) {
          <div class="cs-count-badge">{{ selected().size }}</div>
        }
      </div>

      <div class="cs-scroll">
        @if (loading()) {
          <div class="cs-grid">
            @for (n of skeletons; track n) {
              <div class="cs-skel" [style.animation-delay]="n * 55 + 'ms'"></div>
            }
          </div>
        } @else if (error()) {
          <div class="cs-error">
            <span>Failed to load categories.</span>
            <button class="cs-retry" (click)="loadCategories()">Retry</button>
          </div>
        } @else {
          <div class="cs-grid">
            @for (cat of categories(); track cat.id; let i = $index) {
              <button
                class="cs-tile"
                type="button"
                [class.cs-tile--on]="selected().has(cat.id)"
                [style.--tile-bg]="palette(i).bg"
                [style.--tile-fg]="palette(i).fg"
                [style.animation-delay]="i * 35 + 'ms'"
                (click)="toggle(cat.id)"
              >
                <div class="cs-tile-check">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span class="cs-tile-name">{{ cat.name }}</span>
                <div class="cs-tile-deco cs-tile-deco--a"></div>
                <div class="cs-tile-deco cs-tile-deco--b"></div>
              </button>
            }
          </div>
        }
      </div>

      <div class="cs-footer">
        <div class="cs-footer-hint">
          @if (selected().size === 0) { Pick at least one genre to continue }
          @else if (selected().size === 1) { 1 genre selected — pick more for better results! }
          @else { {{ selected().size }} genres selected }
        </div>
        <button class="cs-btn" [disabled]="selected().size === 0 || saving()" (click)="save()">
          @if (saving()) {
            <span class="cs-spin"></span> Saving…
          } @else {
            <span>Let's go</span>
            <span class="cs-btn-arrow">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </span>
          }
        </button>
        <button class="cs-skip" (click)="skip()">Skip for now</button>
      </div>
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
      --bdr:    rgba(242,238,230,.07);
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: block; width: 100%;
    }
    .cs-sheet {
      background: var(--bg); border-radius: 24px 24px 0 0;
      display: flex; flex-direction: column; max-height: 92dvh;
      overflow: hidden; width: 100%;
    }
    .cs-handle {
      width: 40px; height: 4px; border-radius: 99px;
      background: rgba(242,238,230,.15); margin: 14px auto 0; flex-shrink: 0;
    }
    .cs-header {
      padding: 1.25rem 1.25rem .5rem;
      display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0;
    }
    .cs-header-text { display: flex; flex-direction: column; gap: .35rem; }
    .cs-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2rem, 6vw, 2.8rem);
      letter-spacing: .03em; line-height: .92; color: var(--text); margin: 0;
    }
    .cs-accent { color: var(--gold); }
    .cs-sub { font-size: .82rem; color: var(--muted); font-weight: 300; line-height: 1.6; max-width: 260px; }
    .cs-count-badge {
      min-width: 36px; height: 36px; border-radius: 50%;
      background: var(--gold); color: #1a1200;
      font-family: 'Bebas Neue', sans-serif; font-size: 1.05rem; letter-spacing: .05em;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 4px;
      animation: pop .25s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes pop { from { transform: scale(.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .cs-scroll {
      flex: 1; overflow-y: auto; padding: .5rem 1.25rem;
      scrollbar-width: thin; scrollbar-color: rgba(242,238,230,.1) transparent;
    }
    .cs-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: .6rem; padding-bottom: .5rem;
    }
    @media (min-width: 400px) { .cs-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 640px) { .cs-grid { grid-template-columns: repeat(4, 1fr); } }
    .cs-tile {
      position: relative; overflow: hidden; border-radius: 14px;
      border: 2.5px solid transparent;
      background: var(--tile-bg, #1a1a22); color: var(--tile-fg, var(--text));
      padding: 1rem .85rem .85rem; min-height: 76px; cursor: pointer; text-align: left;
      transition: transform .22s cubic-bezier(.22,1,.36,1), border-color .18s, box-shadow .22s;
      -webkit-tap-highlight-color: transparent;
      animation: tileIn .4s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes tileIn { from { opacity:0; transform:scale(.9); } to { opacity:1; transform:scale(1); } }
    .cs-tile:hover { transform: scale(1.04); }
    .cs-tile--on {
      border-color: rgba(255,255,255,.65) !important;
      box-shadow: 0 0 0 4px rgba(255,255,255,.12), 0 8px 28px rgba(0,0,0,.45);
      transform: scale(1.05);
    }
    .cs-tile-deco {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,.1); pointer-events: none;
    }
    .cs-tile-deco--a { width: 64px; height: 64px; bottom: -20px; right: -20px; }
    .cs-tile-deco--b { width: 36px; height: 36px; bottom: 10px; right: 24px; background: rgba(255,255,255,.06); }
    .cs-tile-check {
      position: absolute; top: .55rem; right: .55rem;
      width: 22px; height: 22px; border-radius: 50%;
      background: rgba(255,255,255,.18); border: 1.5px solid rgba(255,255,255,.45);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: scale(.5);
      transition: opacity .2s, transform .25s cubic-bezier(.34,1.56,.64,1), background .2s;
    }
    .cs-tile--on .cs-tile-check {
      opacity: 1; transform: scale(1);
      background: rgba(255,255,255,.95); border-color: transparent; color: #000;
    }
    .cs-tile-name {
      display: block; position: relative; z-index: 1;
      font-family: 'Bebas Neue', sans-serif; font-size: 1.05rem; letter-spacing: .04em; line-height: 1;
    }
    .cs-skel {
      height: 76px; border-radius: 14px;
      background: linear-gradient(90deg, rgba(242,238,230,.04) 25%, rgba(242,238,230,.08) 50%, rgba(242,238,230,.04) 75%);
      background-size: 600px 100%; animation: shimmer 1.5s ease-in-out infinite;
    }
    @keyframes shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }
    .cs-error {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      padding: 2.5rem 1rem; color: var(--muted); font-size: .85rem;
    }
    .cs-retry {
      background: none; border: 1px solid var(--bdr); border-radius: 8px;
      padding: .45rem .9rem; color: var(--text); font-size: .8rem; cursor: pointer;
    }
    .cs-footer {
      flex-shrink: 0; padding: 1rem 1.25rem 1.5rem;
      display: flex; flex-direction: column; gap: .6rem;
      border-top: 1px solid var(--bdr);
      background: linear-gradient(to bottom, transparent, var(--bg) 30%);
    }
    .cs-footer-hint {
      text-align: center; font-family: 'DM Mono', monospace;
      font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted);
    }
    .cs-btn {
      width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: .65rem;
      padding: .85rem 1.5rem; border-radius: 12px;
      background: var(--gold); color: #1a1200; border: none;
      font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: .95rem;
      cursor: pointer; transition: box-shadow .25s, transform .18s, opacity .2s;
      box-shadow: 0 0 32px rgba(240,180,41,.28);
    }
    .cs-btn:hover:not(:disabled) { box-shadow: 0 0 56px rgba(240,180,41,.5); transform: translateY(-2px); }
    .cs-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }
    .cs-btn-arrow {
      width: 28px; height: 28px; background: rgba(0,0,0,.15); border-radius: 8px;
      display: flex; align-items: center; justify-content: center; transition: transform .2s;
    }
    .cs-btn:hover:not(:disabled) .cs-btn-arrow { transform: translateX(3px); }
    .cs-skip {
      background: none; border: none; padding: .4rem;
      font-size: .8rem; font-weight: 500; color: var(--muted); cursor: pointer;
      transition: color .2s; text-align: center;
    }
    .cs-skip:hover { color: var(--text); }
    .cs-spin {
      width: 16px; height: 16px;
      border: 2px solid rgba(26,18,0,.3); border-top-color: #1a1200;
      border-radius: 50%; animation: spin .7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class CategorySelectSheet implements OnInit {
  private readonly dialogRef  = inject(ZardDialogRef);
  private readonly catService = inject(CategoryService);
  private readonly userSvc    = inject(UserService);
  private readonly authSvc    = inject(AuthService);
  private readonly router     = inject(Router);

  categories = signal<Category[]>([]);
  selected   = signal<Set<number>>(new Set());
  loading    = signal(true);
  saving     = signal(false);
  error      = signal(false);

  readonly skeletons = Array.from({ length: 12 }, (_, i) => i);

  ngOnInit() {
    // ── ONE-TIME GATE ────────────────────────────────────────────────────
    // If the user already has saved category preferences, skip this sheet
    // entirely and navigate straight to the dashboard.
    const alreadySaved = this.authSvc.getSavedCategoryIds();
    if (alreadySaved && alreadySaved.length > 0) {
      this.finish();
      return;
    }
    this.loadCategories();
  }

  palette(i: number) { return PALETTE[i % PALETTE.length]; }

  loadCategories() {
    this.loading.set(true);
    this.error.set(false);
    this.catService.getAllCategories().subscribe({
      next:  cats => { this.categories.set(cats); this.loading.set(false); },
      error: ()   => { this.error.set(true); this.loading.set(false); },
    });
  }

  toggle(id: number) {
    this.selected.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  save() {
    if (this.selected().size === 0 || this.saving()) return;
    this.saving.set(true);
    const ids = Array.from(this.selected());
    this.authSvc.saveCategoryIds(ids);

    this.userSvc.addFavorites(ids).subscribe({
      next:  () => { this.saving.set(false); this.finish(); },
      error: () => { this.saving.set(false); this.finish(); },
    });
  }

  skip() {
    // Mark as "seen" with empty array so we don't show again
    this.authSvc.saveCategoryIds([]);
    this.finish();
  }

  private finish() {
    this.dialogRef.close({ selectedIds: Array.from(this.selected()) });
    this.router.navigate(['/user-dashboard']);
  }
}