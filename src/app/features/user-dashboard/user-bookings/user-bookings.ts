// src/app/features/user-dashboard/user-bookings/user-bookings.ts
//
// Route: /user-dashboard/bookings
// Shows all bookings via GET /api/Ticket/MyBookings
// Each booking card shows: event name, ticket tier, price, date, status (used/unused)
// Expandable detail view shows the unique ticket code (QR-style display)
//
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { TicketService, Booking } from '@core/services/ticket.service';

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-EG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
function fmtTime(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
}

@Component({
  selector: 'app-user-bookings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

    <div class="ub-root">

      <!-- ── Header ── -->
      <header class="ub-hero">
        <div class="ub-hero-orb" aria-hidden="true"></div>
        <div class="ub-hero-content">
          <div class="ub-eyebrow">
            <span class="ub-pill">My Tickets</span>
            @if (!loading() && bookings().length > 0) {
              <span class="ub-pill ub-pill--muted">{{ bookings().length }} booking{{ bookings().length !== 1 ? 's' : '' }}</span>
            }
          </div>
          <h1 class="ub-title">
            <span class="ub-title-stroke">YOUR</span>
            <span class="ub-title-solid">BOOKINGS</span>
          </h1>
          <p class="ub-subtitle">All your event tickets in one place.</p>
        </div>
      </header>

      <!-- ── Content ── -->
      <main class="ub-main">

        @if (loading()) {
          <!-- Skeletons -->
          <div class="ub-list">
            @for (n of skeletons; track n) {
              <div class="ub-skel" [style.animation-delay]="n * 70 + 'ms'">
                <div class="ub-skel__left">
                  <div class="ub-skel__line ub-skel__line--xs"></div>
                  <div class="ub-skel__line ub-skel__line--lg"></div>
                  <div class="ub-skel__line ub-skel__line--md"></div>
                </div>
                <div class="ub-skel__right">
                  <div class="ub-skel__line ub-skel__line--sm"></div>
                  <div class="ub-skel__badge"></div>
                </div>
              </div>
            }
          </div>

        } @else if (error()) {
          <div class="ub-empty">
            <div class="ub-empty__icon">⚠️</div>
            <p class="ub-empty__title">Couldn't load bookings</p>
            <p class="ub-empty__sub">Check your connection and try again.</p>
            <button class="ub-btn" (click)="load()">Try again</button>
          </div>

        } @else if (bookings().length === 0) {
          <div class="ub-empty">
            <div class="ub-empty__icon">🎟️</div>
            <p class="ub-empty__title">No bookings yet</p>
            <p class="ub-empty__sub">Explore events and grab your first ticket!</p>
            <button class="ub-btn" (click)="router.navigate(['/user-dashboard'])">
              Browse Events
            </button>
          </div>

        } @else {
          <!-- Filter tabs -->
          <div class="ub-tabs">
            <button class="ub-tab" [class.ub-tab--on]="filter() === 'all'"     (click)="filter.set('all')">All</button>
            <button class="ub-tab" [class.ub-tab--on]="filter() === 'unused'"  (click)="filter.set('unused')">Unused</button>
            <button class="ub-tab" [class.ub-tab--on]="filter() === 'used'"    (click)="filter.set('used')">Used</button>
          </div>

          @if (filtered().length === 0) {
            <div class="ub-empty ub-empty--sm">
              <div class="ub-empty__icon">📭</div>
              <p class="ub-empty__title">No {{ filter() }} tickets</p>
            </div>
          } @else {
            <div class="ub-list">
              @for (b of filtered(); track b.id; let i = $index) {
                <div class="ub-card" [class.ub-card--used]="b.isUsed"
                     [style.animation-delay]="i * 50 + 'ms'">

                  <!-- Tear perforations -->
                  <div class="ub-card__perf ub-card__perf--top" aria-hidden="true"></div>
                  <div class="ub-card__perf ub-card__perf--bottom" aria-hidden="true"></div>

                  <div class="ub-card__body">
                    <!-- Left section -->
                    <div class="ub-card__left">
                      <!-- Tier badge -->
                      <div class="ub-tier" [class]="'ub-tier--' + tierClass(b)">
                        {{ tierLabel(b) }}
                      </div>

                      <!-- Event title -->
                      <h3 class="ub-card__event-title">
                        {{ getEventTitle(b) }}
                      </h3>

                      <!-- Metadata row -->
                      <div class="ub-card__meta-row">
                        <span class="ub-card__meta">
                          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          Booked {{ fmtDate(b.purchaseDate) }}
                        </span>
                        @if (b.eventTicket?.actualPrice != null) {
                          <span class="ub-card__meta">
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            @if (b.eventTicket!.actualPrice === 0) { Free }
                            @else { EGP {{ b.eventTicket!.actualPrice | number:'1.0-0' }} }
                          </span>
                        }
                      </div>

                      <!-- Ticket name -->
                      @if (b.eventTicket?.ticketTemplate?.name) {
                        <div class="ub-card__ticket-name">{{ b.eventTicket!.ticketTemplate!.name }}</div>
                      }
                    </div>

                    <!-- Divider (dashed vertical) -->
                    <div class="ub-card__divider" aria-hidden="true"></div>

                    <!-- Right section -->
                    <div class="ub-card__right">
                      <!-- Status badge -->
                      @if (b.isUsed) {
                        <span class="ub-status ub-status--used">
                          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Used
                        </span>
                      } @else {
                        <span class="ub-status ub-status--valid">
                          <span class="ub-pulse"></span>
                          Valid
                        </span>
                      }

                      <!-- Show / hide ticket code -->
                      <button class="ub-show-btn"
                              (click)="toggleExpand(b.id)">
                        {{ expanded() === b.id ? 'Hide' : 'Show' }} ticket
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
                             [style.transform]="expanded() === b.id ? 'rotate(180deg)' : 'none'"
                             style="transition: transform .2s">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- ── Expanded ticket code ── -->
                  @if (expanded() === b.id) {
                    <div class="ub-card__expand">
                      <div class="ub-ticket-code-wrap">
                        <!-- Fake QR pattern using CSS grid -->
                        <div class="ub-qr" aria-hidden="true">
                          @for (cell of qrPattern; track $index) {
                            <div class="ub-qr__cell" [class.ub-qr__cell--filled]="cell === 1"></div>
                          }
                        </div>

                        <div class="ub-ticket-code-info">
                          <div class="ub-code-label">Ticket Code</div>
                          <div class="ub-code-value">{{ formatCode(b.ticketUniqueCode) }}</div>

                          @if (b.isUsed && b.usedAt) {
                            <div class="ub-used-at">
                              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Used on {{ fmtDate(b.usedAt) }} at {{ fmtTime(b.usedAt) }}
                            </div>
                          }

                          <button class="ub-copy-btn" (click)="copyCode(b.ticketUniqueCode)">
                            @if (copied() === b.ticketUniqueCode) {
                              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                              Copied!
                            } @else {
                              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                              </svg>
                              Copy code
                            }
                          </button>
                        </div>
                      </div>

                      <!-- View event button -->
                      @if (b.eventTicket?.eventId) {
                        <button class="ub-view-event-btn"
                                (click)="router.navigate(['/user-dashboard/events', b.eventTicket!.eventId])">
                          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                          View Event
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      --coral:  #FF4433;
      --gold:   #F0B429;
      --green:  #22c55e;
      --purple: #a78bfa;
      --sky:    #0ea5e9;
      --bg:     #060608;
      --bg2:    #09090c;
      --bg3:    #111116;
      --text:   #F2EEE6;
      --muted:  rgba(242,238,230,.45);
      --bdr:    rgba(242,238,230,.07);
      --bdrhi:  rgba(242,238,230,.14);
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: block; background: var(--bg); color: var(--text); min-height: 100%;
    }

    /* ── Hero ── */
    .ub-hero {
      position: relative; overflow: hidden;
      padding: 2.5rem 1.5rem 2rem;
    }
    .ub-hero-orb {
      position: absolute; top: -80px; right: -60px;
      width: 280px; height: 280px; border-radius: 50%; pointer-events: none; z-index: 0;
      background: radial-gradient(circle, rgba(240,180,41,.09) 0%, transparent 65%);
    }
    .ub-hero-content { position: relative; z-index: 1; }
    .ub-eyebrow { display: flex; align-items: center; gap: .5rem; margin-bottom: .75rem; }
    .ub-pill {
      display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 100px;
      background: rgba(240,180,41,.1); border: 1px solid rgba(240,180,41,.22);
      font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: .12em;
      text-transform: uppercase; color: var(--gold);
    }
    .ub-pill--muted { background: rgba(242,238,230,.04); border-color: var(--bdr); color: var(--muted); }
    .ub-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(3rem, 9vw, 5.5rem);
      letter-spacing: .04em; line-height: .88; margin: 0 0 .4rem;
      display: flex; flex-direction: column;
    }
    .ub-title-stroke { -webkit-text-stroke: 2px var(--gold); color: transparent; }
    .ub-title-solid  { color: var(--text); }
    .ub-subtitle { font-size: .85rem; color: var(--muted); margin: 0; font-weight: 300; }

    /* ── Main ── */
    .ub-main { padding: 0 1.5rem 3rem; }

    /* ── Filter tabs ── */
    .ub-tabs { display: flex; gap: .4rem; margin-bottom: 1.25rem; }
    .ub-tab {
      padding: .38rem .9rem; border-radius: 100px;
      background: var(--bg3); border: 1px solid var(--bdr);
      color: var(--muted); font-size: .8rem; font-weight: 500;
      cursor: pointer; transition: all .2s;
    }
    .ub-tab:hover { border-color: var(--bdrhi); color: var(--text); }
    .ub-tab--on {
      background: rgba(240,180,41,.1); border-color: rgba(240,180,41,.3) !important;
      color: var(--gold) !important; font-weight: 700;
    }

    /* ── Booking list ── */
    .ub-list { display: flex; flex-direction: column; gap: .85rem; }

    /* ── Booking card ── */
    .ub-card {
      position: relative; overflow: hidden;
      background: var(--bg2); border: 1px solid var(--bdr); border-radius: 16px;
      transition: border-color .2s, box-shadow .2s;
      animation: slideUp .4s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    .ub-card:hover { border-color: var(--bdrhi); box-shadow: 0 8px 32px rgba(0,0,0,.35); }
    .ub-card--used { opacity: .65; }
    .ub-card--used:hover { opacity: 1; }

    /* Perforation dots */
    .ub-card__perf {
      position: absolute; left: 0; right: 0; height: 1px;
      background: repeating-linear-gradient(
        90deg,
        transparent, transparent 6px,
        rgba(242,238,230,.12) 6px, rgba(242,238,230,.12) 8px
      );
    }
    .ub-card__perf--top    { top: 0; }
    .ub-card__perf--bottom { bottom: 0; }

    .ub-card__body {
      display: flex; align-items: stretch; gap: 0; padding: 1.1rem 1.2rem;
    }

    /* Left */
    .ub-card__left { flex: 1; display: flex; flex-direction: column; gap: .45rem; min-width: 0; }

    .ub-tier {
      display: inline-flex; align-items: center;
      padding: 2px 9px; border-radius: 5px; width: fit-content;
      font-family: 'DM Mono', monospace; font-size: .55rem;
      letter-spacing: .14em; text-transform: uppercase; font-weight: 500;
    }
    .ub-tier--standard { background: rgba(242,238,230,.07); color: var(--muted); border: 1px solid var(--bdr); }
    .ub-tier--vip      { background: rgba(167,139,250,.12); color: var(--purple); border: 1px solid rgba(167,139,250,.25); }
    .ub-tier--premium  { background: rgba(240,180,41,.1);   color: var(--gold);   border: 1px solid rgba(240,180,41,.22); }

    .ub-card__event-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: .03em;
      color: var(--text); margin: 0; line-height: 1.1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .ub-card__meta-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .ub-card__meta {
      display: flex; align-items: center; gap: 4px;
      font-size: .73rem; color: var(--muted);
    }
    .ub-card__ticket-name {
      font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted);
      letter-spacing: .06em;
    }

    /* Dashed divider */
    .ub-card__divider {
      width: 1px; margin: 0 1.1rem; flex-shrink: 0;
      background: repeating-linear-gradient(
        180deg,
        transparent, transparent 4px,
        rgba(242,238,230,.1) 4px, rgba(242,238,230,.1) 7px
      );
    }

    /* Right */
    .ub-card__right {
      display: flex; flex-direction: column; align-items: flex-end;
      justify-content: space-between; gap: .75rem; flex-shrink: 0; min-width: 90px;
    }

    .ub-status {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 100px;
      font-family: 'DM Mono', monospace; font-size: .6rem; letter-spacing: .1em; text-transform: uppercase;
    }
    .ub-status--valid {
      background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); color: var(--green);
    }
    .ub-status--used {
      background: rgba(242,238,230,.05); border: 1px solid var(--bdr); color: var(--muted);
    }

    .ub-pulse {
      width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.7); } }

    .ub-show-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: .35rem .75rem; border-radius: 7px;
      background: rgba(242,238,230,.05); border: 1px solid var(--bdr);
      color: var(--muted); font-size: .72rem; font-weight: 500;
      cursor: pointer; transition: all .2s; white-space: nowrap;
    }
    .ub-show-btn:hover { border-color: var(--bdrhi); color: var(--text); background: rgba(242,238,230,.08); }

    /* ── Expanded section ── */
    .ub-card__expand {
      border-top: 1px dashed rgba(242,238,230,.1);
      padding: 1.1rem 1.2rem;
      display: flex; align-items: flex-start; gap: 1.25rem; flex-wrap: wrap;
      animation: expandIn .25s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes expandIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

    .ub-ticket-code-wrap { display: flex; gap: 1rem; align-items: flex-start; flex: 1; min-width: 0; }

    /* QR display */
    .ub-qr {
      width: 72px; height: 72px; flex-shrink: 0;
      display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px;
      padding: 6px; background: var(--text); border-radius: 8px;
    }
    .ub-qr__cell { border-radius: 1px; background: transparent; }
    .ub-qr__cell--filled { background: #09090c; }

    .ub-ticket-code-info { display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
    .ub-code-label {
      font-family: 'DM Mono', monospace; font-size: .55rem;
      letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
    }
    .ub-code-value {
      font-family: 'DM Mono', monospace; font-size: .78rem; color: var(--text);
      letter-spacing: .06em; word-break: break-all;
    }
    .ub-used-at {
      display: flex; align-items: center; gap: 4px;
      font-size: .7rem; color: var(--muted);
    }

    .ub-copy-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: .35rem .75rem; border-radius: 7px; width: fit-content;
      background: rgba(240,180,41,.08); border: 1px solid rgba(240,180,41,.2);
      color: var(--gold); font-size: .72rem; font-weight: 600;
      cursor: pointer; transition: all .2s;
    }
    .ub-copy-btn:hover { background: rgba(240,180,41,.15); border-color: rgba(240,180,41,.35); }

    .ub-view-event-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: .5rem 1rem; border-radius: 9px; align-self: flex-end;
      background: none; border: 1px solid var(--bdr);
      color: var(--muted); font-size: .78rem; font-weight: 500;
      cursor: pointer; transition: all .2s; white-space: nowrap;
    }
    .ub-view-event-btn:hover { border-color: var(--bdrhi); color: var(--text); }

    /* ── Skeletons ── */
    .ub-skel {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.2rem; border-radius: 16px;
      background: var(--bg2); border: 1px solid var(--bdr);
      animation: fadeIn .4s both;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .ub-skel__left { display: flex; flex-direction: column; gap: .5rem; flex: 1; }
    .ub-skel__right { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; }
    .ub-skel__line, .ub-skel__badge {
      border-radius: 6px;
      background: linear-gradient(90deg, rgba(242,238,230,.04) 25%, rgba(242,238,230,.07) 50%, rgba(242,238,230,.04) 75%);
      background-size: 600px 100%; animation: shimmer 1.4s ease-in-out infinite;
    }
    .ub-skel__line--xs { height: 12px; width: 25%; }
    .ub-skel__line--lg { height: 20px; width: 65%; }
    .ub-skel__line--md { height: 12px; width: 45%; }
    .ub-skel__line--sm { height: 14px; width: 60px; }
    .ub-skel__badge    { height: 26px; width: 70px; border-radius: 100px; }
    @keyframes shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }

    /* ── Empty states ── */
    .ub-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: .75rem; padding: 5rem 1rem; text-align: center;
    }
    .ub-empty--sm { padding: 2.5rem 1rem; }
    .ub-empty__icon { font-size: 2.5rem; }
    .ub-empty__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: .04em; color: var(--text); margin: 0; }
    .ub-empty__sub   { font-size: .84rem; color: var(--muted); margin: 0; font-weight: 300; }

    .ub-btn {
      padding: .6rem 1.5rem; border-radius: 10px;
      background: var(--gold); color: #1a1200; border: none;
      font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: .85rem;
      cursor: pointer; transition: opacity .2s;
    }
    .ub-btn:hover { opacity: .85; }

    @media (max-width: 640px) {
      .ub-hero { padding: 1.75rem 1rem 1.5rem; }
      .ub-main { padding: 0 1rem 3rem; }
      .ub-card__divider { display: none; }
      .ub-card__right { min-width: unset; }
      .ub-qr { width: 60px; height: 60px; }
    }
  `],
})
export class UserBookingsComponent implements OnInit, OnDestroy {
  readonly router      = inject(Router);
  private readonly svc = inject(TicketService);
  private readonly d$  = new Subject<void>();

  bookings = signal<Booking[]>([]);
  loading  = signal(true);
  error    = signal(false);
  filter   = signal<'all' | 'used' | 'unused'>('all');
  expanded = signal<number | null>(null);
  copied   = signal<string | null>(null);

  readonly skeletons = Array.from({ length: 4 }, (_, i) => i);

  // Static QR-ish 8×8 pattern (decorative only)
  readonly qrPattern = [
    1,1,1,0,1,1,1,0,
    1,0,1,0,0,1,0,0,
    1,1,1,0,0,0,1,0,
    0,0,0,0,1,0,1,0,
    1,1,0,1,1,1,1,0,
    0,1,0,0,0,0,1,0,
    1,1,1,0,1,1,1,0,
    0,0,0,0,0,0,0,0,
  ];

  readonly fmtDate = fmtDate;
  readonly fmtTime = fmtTime;

  filtered = () => {
    const f = this.filter();
    const list = this.bookings();
    if (f === 'used')   return list.filter(b =>  b.isUsed);
    if (f === 'unused') return list.filter(b => !b.isUsed);
    return list;
  };

  ngOnInit()    { this.load(); }
  ngOnDestroy() { this.d$.next(); this.d$.complete(); }

  load() {
    this.loading.set(true);
    this.error.set(false);

    // GET /api/Ticket/MyBookings
    this.svc.getMyBookings().pipe(
      catchError(() => of([] as Booking[])),
      takeUntil(this.d$),
    ).subscribe({
      next: list => {
        // Newest first
        this.bookings.set([...list].sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
        ));
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  toggleExpand(id: number) {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.copied.set(code);
      setTimeout(() => this.copied.set(null), 2000);
    } catch { /* silent */ }
  }

  formatCode(code: string): string {
    // Show first 8 chars + … + last 8
    if (code.length <= 20) return code;
    return `${code.slice(0, 8)}…${code.slice(-8)}`;
  }

  getEventTitle(b: Booking): string {
    const nested = (b.eventTicket as any)?.event?.title as string | undefined;
    if (nested) return nested;
    if (b.eventTicket?.eventId) return `Event #${b.eventTicket.eventId}`;
    return `Booking #${b.id}`;
  }

  tierLabel(b: Booking): string {
    const tier = b.eventTicket?.ticketTemplate?.tier;
    if (tier === 1) return 'VIP';
    if (tier === 2) return 'Premium';
    return 'Standard';
  }

  tierClass(b: Booking): string {
    const tier = b.eventTicket?.ticketTemplate?.tier;
    if (tier === 1) return 'vip';
    if (tier === 2) return 'premium';
    return 'standard';
  }
}