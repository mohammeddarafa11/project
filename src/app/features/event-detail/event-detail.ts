// src/app/features/event-detail/event-detail.ts
//
// Public event detail page + ticket booking.
// Route: /events/:id
//
// Booking flow:
//   1. Load event via GET /api/Event/{id}
//   2. Load tickets via GET /api/Ticket/EventTickets/{eventId}
//   3. User selects a ticket tier → POST /api/Ticket/BookTicket?eventTicketId={id}
//
import {
 Component, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { EventService } from '@core/services/event.service';
import { TicketService, EventTicket } from '@core/services/ticket.service';
import { Event as EsEvent } from '@core/models/event.model';

function fmt(iso?: string) {
 if (!iso) return '';
 return new Date(iso).toLocaleDateString('en-EG', {
   weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
 });
}
function fmtTime(iso?: string) {
 if (!iso) return '';
 return new Date(iso).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
}

@Component({
 selector: 'app-event-detail',
 standalone: true,
 imports: [CommonModule, RouterModule],
 template: `
   <link rel="preconnect" href="https://fonts.googleapis.com"/>
   <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

   <div class="ed-root">

     <!-- Back -->
     <button class="ed-back" (click)="goBack()">
       <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
       </svg>
       Back
     </button>

     @if (loading()) {
       <!-- Skeleton -->
       <div class="ed-skel">
         <div class="ed-skel__hero"></div>
         <div class="ed-skel__body">
           <div class="ed-skel__line ed-skel__line--xl"></div>
           <div class="ed-skel__line ed-skel__line--md"></div>
           <div class="ed-skel__line ed-skel__line--sm"></div>
         </div>
       </div>

     } @else if (error()) {
       <div class="ed-empty">
         <div class="ed-empty__icon">⚠️</div>
         <p class="ed-empty__title">Couldn't load event</p>
         <button class="ed-btn" (click)="load()">Try again</button>
       </div>

     } @else if (event()) {
       <!-- ── Hero image ── -->
       <div class="ed-hero">
         @if (event()!.event_img_url) {
           <img [src]="event()!.event_img_url" [alt]="event()!.title" class="ed-hero__img"/>
         } @else {
           <div class="ed-hero__placeholder">
             <svg width="56" height="56" fill="none" stroke="currentColor" stroke-width=".8" viewBox="0 0 24 24" opacity=".2">
               <path stroke-linecap="round" stroke-linejoin="round"
                     d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"/>
             </svg>
           </div>
         }
         @if (event()!.category?.name) {
           <span class="ed-cat-badge">{{ event()!.category?.name }}</span>
         }
       </div>

       <!-- ── Content wrapper ── -->
       <div class="ed-content">

         <!-- ── Left: info ── -->
         <section class="ed-info">
           <h1 class="ed-title">{{ event()!.title }}</h1>

           <!-- Meta row -->
           <div class="ed-meta-row">
             @if (event()!.start_time) {
               <div class="ed-meta-item">
                 <div class="ed-meta-item__icon">
                   <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round"
                           d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                   </svg>
                 </div>
                 <div>
                   <div class="ed-meta-item__label">Date &amp; Time</div>
                   <div class="ed-meta-item__value">{{ fmt(event()!.start_time) }}</div>
                   <div class="ed-meta-item__sub">
                     {{ fmtTime(event()!.start_time) }}
                     @if (event()!.end_time) { – {{ fmtTime(event()!.end_time) }} }
                   </div>
                 </div>
               </div>
             }

             @if (event()!.city || event()!.nameOfPlace) {
               <div class="ed-meta-item">
                 <div class="ed-meta-item__icon">
                   <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round"
                           d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                   </svg>
                 </div>
                 <div>
                   <div class="ed-meta-item__label">Location</div>
                   <div class="ed-meta-item__value">{{ event()!.nameOfPlace || event()!.city }}</div>
                   @if (event()!.nameOfPlace && event()!.city) {
                     <div class="ed-meta-item__sub">{{ event()!.city }}</div>
                   }
                 </div>
               </div>
             }

             @if (event()!.organization?.name) {
               <div class="ed-meta-item">
                 <div class="ed-meta-item__icon">
                   <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round"
                           d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                   </svg>
                 </div>
                 <div>
                   <div class="ed-meta-item__label">Organiser</div>
                   <div class="ed-meta-item__value">{{ event()!.organization?.name }}</div>
                 </div>
               </div>
             }
           </div>

           <!-- Description -->
           @if (event()!.description) {
             <div class="ed-section">
               <h2 class="ed-section__title">About this event</h2>
               <p class="ed-desc">{{ event()!.description }}</p>
             </div>
           }
         </section>

         <!-- ── Right: ticket booking panel ── -->
         <aside class="ed-ticket-panel">
           <h2 class="ed-panel-title">
             <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round"
                     d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
             </svg>
             Tickets
           </h2>

           @if (ticketsLoading()) {
             <div class="ed-ticket-skel">
               @for (n of [0,1,2]; track n) {
                 <div class="ed-ticket-skel__item" [style.animation-delay]="n*80+'ms'"></div>
               }
             </div>

           } @else if (tickets().length === 0) {
             <div class="ed-no-tickets">
               <span class="ed-no-tickets__icon">🎟️</span>
               <p>No tickets available for this event.</p>
             </div>

           } @else {
             <!-- Ticket options -->
             <div class="ed-ticket-list">
               @for (t of tickets(); track t.id; let i = $index) {
                 <button
                   class="ed-ticket-card"
                   [class.ed-ticket-card--selected]="selectedTicketId() === t.id"
                   [class.ed-ticket-card--sold-out]="isSoldOut(t)"
                   [disabled]="isSoldOut(t)"
                   (click)="selectTicket(t)"
                 >
                   <div class="ed-ticket-card__left">
                     <div class="ed-ticket-card__tier">{{ tierLabel(t) }}</div>
                     <div class="ed-ticket-card__name">{{ t.ticketTemplate?.name || 'General Admission' }}</div>
                     @if (t.ticketTemplate?.description) {
                       <div class="ed-ticket-card__desc">{{ t.ticketTemplate?.description }}</div>
                     }
                     <div class="ed-ticket-card__avail">
                       @if (isSoldOut(t)) {
                         <span class="ed-badge ed-badge--red">Sold Out</span>
                       } @else {
                         <span class="ed-badge ed-badge--green">
                           {{ t.totalQuantity - t.soldQuantity }} left
                         </span>
                       }
                     </div>
                   </div>
                   <div class="ed-ticket-card__price">
                     @if (t.actualPrice === 0) {
                       <span class="ed-price-free">Free</span>
                     } @else {
                       <span class="ed-price-amt">{{ t.actualPrice | number:'1.0-0' }}</span>
                       <span class="ed-price-cur">EGP</span>
                     }
                   </div>
                   @if (selectedTicketId() === t.id) {
                     <div class="ed-ticket-card__check">
                       <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                       </svg>
                     </div>
                   }
                 </button>
               }
             </div>

             <!-- Book CTA -->
             <div class="ed-book-cta">
               @if (bookingSuccess()) {
                 <div class="ed-success">
                   <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                   </svg>
                   Ticket booked! Check <strong>My Bookings</strong>.
                 </div>
               } @else {
                 @if (bookingError()) {
                   <div class="ed-error-msg">{{ bookingError() }}</div>
                 }
                 <button
                   class="ed-book-btn"
                   [disabled]="!selectedTicketId() || booking()"
                   (click)="book()"
                 >
                   @if (booking()) {
                     <span class="ed-spin"></span> Booking…
                   } @else if (!selectedTicketId()) {
                     Select a ticket
                   } @else {
                     <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round"
                             d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                     </svg>
                     Book Ticket
                   }
                 </button>
               }
             </div>
           }
         </aside>
       </div>
     }
   </div>
 `,
 styles: [`
   :host {
     --coral:  #FF4433;
     --gold:   #F0B429;
     --green:  #22c55e;
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

   /* ── Root ── */
   .ed-root { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }

   /* Back button */
   .ed-back {
     display: inline-flex; align-items: center; gap: 6px;
     padding: .45rem .9rem; border-radius: 8px;
     background: none; border: 1px solid var(--bdr);
     color: var(--muted); font-size: .8rem; font-weight: 500;
     cursor: pointer; transition: color .2s, border-color .2s;
     margin-bottom: 1.25rem;
   }
   .ed-back:hover { color: var(--text); border-color: var(--bdrhi); }

   /* ── Hero ── */
   .ed-hero {
     position: relative; border-radius: 20px; overflow: hidden;
     aspect-ratio: 21/9; background: var(--bg3);
     margin-bottom: 1.75rem;
   }
   .ed-hero__img { width: 100%; height: 100%; object-fit: cover; }
   .ed-hero__placeholder {
     width: 100%; height: 100%;
     display: flex; align-items: center; justify-content: center;
   }
   .ed-cat-badge {
     position: absolute; bottom: 1rem; left: 1rem;
     padding: 4px 12px; border-radius: 8px;
     background: rgba(9,9,12,.75); backdrop-filter: blur(6px);
     font-family: 'DM Mono', monospace; font-size: .6rem;
     letter-spacing: .1em; text-transform: uppercase; color: var(--gold);
     border: 1px solid rgba(240,180,41,.25);
   }

   /* ── Content layout ── */
   .ed-content {
     display: grid;
     grid-template-columns: 1fr 360px;
     gap: 2rem;
     align-items: start;
   }
   @media (max-width: 860px) {
     .ed-content { grid-template-columns: 1fr; }
   }

   /* ── Info ── */
   .ed-title {
     font-family: 'Bebas Neue', sans-serif;
     font-size: clamp(2rem, 5vw, 3rem);
     letter-spacing: .03em; line-height: .95;
     color: var(--text); margin: 0 0 1.25rem;
   }

   .ed-meta-row { display: flex; flex-direction: column; gap: .85rem; margin-bottom: 1.75rem; }
   .ed-meta-item { display: flex; gap: .75rem; align-items: flex-start; }
   .ed-meta-item__icon {
     width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
     background: rgba(240,180,41,.08); border: 1px solid rgba(240,180,41,.15);
     display: flex; align-items: center; justify-content: center; color: var(--gold);
     margin-top: 2px;
   }
   .ed-meta-item__label { font-family: 'DM Mono', monospace; font-size: .58rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
   .ed-meta-item__value { font-weight: 600; font-size: .9rem; color: var(--text); }
   .ed-meta-item__sub   { font-size: .78rem; color: var(--muted); }

   .ed-section { }
   .ed-section__title {
     font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem;
     letter-spacing: .05em; color: var(--text); margin: 0 0 .65rem;
   }
   .ed-desc { font-size: .88rem; color: var(--muted); line-height: 1.75; margin: 0; white-space: pre-wrap; }

   /* ── Ticket Panel ── */
   .ed-ticket-panel {
     background: var(--bg2); border: 1px solid var(--bdr); border-radius: 20px;
     padding: 1.35rem; position: sticky; top: 1.5rem;
   }
   .ed-panel-title {
     display: flex; align-items: center; gap: .5rem;
     font-family: 'Bebas Neue', sans-serif; font-size: 1.15rem;
     letter-spacing: .06em; color: var(--text); margin: 0 0 1rem;
   }

   /* Skeleton */
   .ed-ticket-skel { display: flex; flex-direction: column; gap: .5rem; }
   .ed-ticket-skel__item {
     height: 72px; border-radius: 12px;
     background: linear-gradient(90deg, rgba(242,238,230,.04) 25%, rgba(242,238,230,.07) 50%, rgba(242,238,230,.04) 75%);
     background-size: 600px 100%;
     animation: shimmer 1.4s ease-in-out infinite;
   }
   @keyframes shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }

   /* No tickets */
   .ed-no-tickets {
     display: flex; flex-direction: column; align-items: center; gap: .5rem;
     padding: 2rem 1rem; text-align: center;
     color: var(--muted); font-size: .85rem;
   }
   .ed-no-tickets__icon { font-size: 2rem; }

   /* Ticket list */
   .ed-ticket-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }

   .ed-ticket-card {
     position: relative; display: flex; align-items: center; justify-content: space-between;
     padding: .85rem 1rem; border-radius: 12px;
     background: var(--bg3); border: 1.5px solid var(--bdr);
     cursor: pointer; text-align: left; width: 100%;
     transition: border-color .2s, background .2s, transform .18s;
   }
   .ed-ticket-card:hover:not(:disabled):not(.ed-ticket-card--selected) {
     border-color: var(--bdrhi); background: rgba(242,238,230,.03);
   }
   .ed-ticket-card--selected {
     border-color: var(--gold) !important;
     background: rgba(240,180,41,.06) !important;
   }
   .ed-ticket-card--sold-out { opacity: .45; cursor: not-allowed; }
   .ed-ticket-card:disabled { cursor: not-allowed; }

   .ed-ticket-card__left { flex: 1; min-width: 0; }
   .ed-ticket-card__tier {
     font-family: 'DM Mono', monospace; font-size: .55rem;
     letter-spacing: .14em; text-transform: uppercase; color: var(--gold);
     margin-bottom: 2px;
   }
   .ed-ticket-card__name { font-weight: 600; font-size: .86rem; color: var(--text); }
   .ed-ticket-card__desc {
     font-size: .72rem; color: var(--muted); margin-top: 2px;
     white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;
   }
   .ed-ticket-card__avail { margin-top: 5px; }

   .ed-badge {
     display: inline-block; padding: 2px 7px; border-radius: 5px;
     font-family: 'DM Mono', monospace; font-size: .55rem; letter-spacing: .08em; text-transform: uppercase;
   }
   .ed-badge--green { background: rgba(34,197,94,.12); color: var(--green); border: 1px solid rgba(34,197,94,.22); }
   .ed-badge--red   { background: rgba(255,68,51,.1);  color: var(--coral); border: 1px solid rgba(255,68,51,.2); }

   .ed-ticket-card__price {
     display: flex; flex-direction: column; align-items: flex-end;
     flex-shrink: 0; margin-left: .75rem;
   }
   .ed-price-free { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: var(--green); letter-spacing: .05em; }
   .ed-price-amt  { font-family: 'Bebas Neue', sans-serif; font-size: 1.25rem; color: var(--gold); letter-spacing: .03em; line-height: 1; }
   .ed-price-cur  { font-family: 'DM Mono', monospace; font-size: .6rem; color: var(--muted); letter-spacing: .08em; }

   .ed-ticket-card__check {
     position: absolute; top: .55rem; right: .55rem;
     width: 20px; height: 20px; border-radius: 50%;
     background: var(--gold); color: #1a1200;
     display: flex; align-items: center; justify-content: center;
     animation: pop .25s cubic-bezier(.34,1.56,.64,1);
   }
   @keyframes pop { from { transform: scale(.4); opacity:0; } to { transform: scale(1); opacity:1; } }

   /* CTA */
   .ed-book-cta { display: flex; flex-direction: column; gap: .65rem; }

   .ed-book-btn {
     width: 100%; padding: .9rem; border-radius: 12px; border: none;
     background: var(--gold); color: #1a1200;
     font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: .95rem;
     cursor: pointer; transition: box-shadow .25s, transform .18s, opacity .2s;
     display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
     box-shadow: 0 0 28px rgba(240,180,41,.25);
   }
   .ed-book-btn:hover:not(:disabled) {
     box-shadow: 0 0 48px rgba(240,180,41,.45); transform: translateY(-2px);
   }
   .ed-book-btn:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }

   .ed-spin {
     width: 16px; height: 16px; border: 2px solid rgba(26,18,0,.3); border-top-color: #1a1200;
     border-radius: 50%; animation: spin .7s linear infinite; display: inline-block;
   }
   @keyframes spin { to { transform: rotate(360deg); } }

   .ed-success {
     display: flex; align-items: center; gap: .6rem;
     padding: .85rem 1rem; border-radius: 12px;
     background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25);
     color: var(--green); font-size: .84rem; font-weight: 500;
   }
   .ed-error-msg {
     padding: .6rem .85rem; border-radius: 10px;
     background: rgba(255,68,51,.08); border: 1px solid rgba(255,68,51,.2);
     color: var(--coral); font-size: .78rem;
   }

   /* ── Global skeleton ── */
   .ed-skel { }
   .ed-skel__hero {
     border-radius: 20px; aspect-ratio: 21/9; margin-bottom: 1.75rem;
     background: linear-gradient(90deg, rgba(242,238,230,.04) 25%, rgba(242,238,230,.07) 50%, rgba(242,238,230,.04) 75%);
     background-size: 600px 100%;
     animation: shimmer 1.4s ease-in-out infinite;
   }
   .ed-skel__body { display: flex; flex-direction: column; gap: .75rem; }
   .ed-skel__line {
     border-radius: 8px;
     background: linear-gradient(90deg, rgba(242,238,230,.04) 25%, rgba(242,238,230,.07) 50%, rgba(242,238,230,.04) 75%);
     background-size: 600px 100%;
     animation: shimmer 1.4s ease-in-out infinite;
   }
   .ed-skel__line--xl { height: 48px; width: 60%; }
   .ed-skel__line--md { height: 18px; width: 40%; }
   .ed-skel__line--sm { height: 14px; width: 30%; }

   /* ── Empty / Error ── */
   .ed-empty {
     display: flex; flex-direction: column; align-items: center;
     gap: .75rem; padding: 5rem 1rem; text-align: center;
   }
   .ed-empty__icon { font-size: 2.5rem; }
   .ed-empty__title {
     font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem;
     letter-spacing: .04em; color: var(--text); margin: 0;
   }
   .ed-btn {
     padding: .55rem 1.5rem; border-radius: 10px;
     background: var(--gold); color: #1a1200; border: none;
     font-weight: 700; font-size: .85rem; cursor: pointer;
   }

   /* ── Mobile ── */
   @media (max-width: 640px) {
     .ed-root { padding: 1rem; }
     .ed-hero { aspect-ratio: 16/9; }
   }
 `],
})
export class EventDetail implements OnInit, OnDestroy {
 private readonly route      = inject(ActivatedRoute);
 private readonly router     = inject(Router);
 private readonly eventSvc   = inject(EventService);
 private readonly ticketSvc  = inject(TicketService);
 private readonly destroy$   = new Subject<void>();

 event          = signal<EsEvent | null>(null);
 tickets        = signal<EventTicket[]>([]);
 selectedTicketId = signal<number | null>(null);

 loading        = signal(true);
 error          = signal(false);
 ticketsLoading = signal(false);
 booking        = signal(false);
 bookingSuccess = signal(false);
 bookingError   = signal<string | null>(null);

 readonly fmt     = fmt;
 readonly fmtTime = fmtTime;

 ngOnInit() { this.load(); }
 ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

 load() {
   this.loading.set(true);
   this.error.set(false);

   this.route.paramMap.pipe(
     takeUntil(this.destroy$),
     switchMap(params => {
       const id = Number(params.get('id'));
       return this.eventSvc.getEventById(id).pipe(
         catchError(() => of(null)),
       );
     }),
   ).subscribe(ev => {
     this.loading.set(false);
     if (!ev) { this.error.set(true); return; }
     this.event.set(ev);
     this.loadTickets(ev.id);
   });
 }

 private loadTickets(eventId: number) {
   this.ticketsLoading.set(true);
   this.ticketSvc.getEventTickets(eventId).pipe(
     catchError(() => of([] as EventTicket[])),
     takeUntil(this.destroy$),
   ).subscribe(t => {
     this.tickets.set(t);
     this.ticketsLoading.set(false);
   });
 }

 selectTicket(t: EventTicket) {
   if (this.isSoldOut(t)) return;
   this.selectedTicketId.set(
     this.selectedTicketId() === t.id ? null : t.id,
   );
   this.bookingError.set(null);
   this.bookingSuccess.set(false);
 }

 book() {
   const id = this.selectedTicketId();
   if (!id || this.booking()) return;

   this.booking.set(true);
   this.bookingError.set(null);

   // POST /api/Ticket/BookTicket?eventTicketId={id}
   this.ticketSvc.bookTicket(id).pipe(
     takeUntil(this.destroy$),
   ).subscribe({
     next: () => {
       this.booking.set(false);
       this.bookingSuccess.set(true);
       this.selectedTicketId.set(null);
       // Update sold count locally for immediate feedback
       this.tickets.update(list =>
         list.map(t => t.id === id ? { ...t, soldQuantity: t.soldQuantity + 1 } : t),
       );
     },
     error: (err: any) => {
       this.booking.set(false);
       this.bookingError.set(
         err?.error?.message ?? 'Booking failed. Please try again.',
       );
     },
   });
 }

 isSoldOut(t: EventTicket): boolean {
   return t.soldQuantity >= t.totalQuantity;
 }

 tierLabel(t: EventTicket): string {
   const tier = t.ticketTemplate?.tier;
   if (tier === 1) return 'VIP';
   if (tier === 2) return 'Premium';
   return 'Standard';
 }

 goBack() {
   window.history.length > 1
     ? window.history.back()
     : this.router.navigate(['/user-dashboard']);
 }
}