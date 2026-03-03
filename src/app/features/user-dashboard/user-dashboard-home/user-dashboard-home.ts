// src/app/features/user-dashboard/user-dashboard-home/user-dashboard-home.ts
//
// Layout:
//   1. Editorial greeting hero
//   2. Cinematic spotlight banner (first upcoming event)
//   3. Per-category horizontal-scroll rows (Netflix style)
//
import {
 Component, inject, signal, computed, OnInit, OnDestroy,
 ElementRef, ViewChildren, QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { CategoryService, Category } from '@core/services/category';
import { EventService } from '@core/services/event.service';
import { Event as EsEvent } from '@core/models/event.model';

function fmtDate(iso?: string) {
 if (!iso) return '';
 return new Date(iso).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(iso?: string) {
 if (!iso) return '';
 return new Date(iso).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
}
function isUpcoming(iso?: string) { return !!iso && new Date(iso) > new Date(); }
function daysUntil(iso?: string): number | null {
 if (!iso) return null;
 const diff = new Date(iso).getTime() - Date.now();
 return diff < 0 ? null : Math.ceil(diff / 86_400_000);
}

interface CategoryRow { cat: Category; events: EsEvent[]; color: string; }

const ROW_COLORS = [
 '#F0B429','#FF4433','#1DB954','#a78bfa',
 '#0ea5e9','#f97316','#ec4899','#22d3ee',
 '#84cc16','#6366f1','#14b8a6','#fb7185',
];

@Component({
 selector: 'app-user-dashboard-home',
 standalone: true,
 imports: [CommonModule, RouterModule],
 template: `
   <link rel="preconnect" href="https://fonts.googleapis.com"/>
   <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

   <div class="udh">

     <!-- ═══ GREETING HERO ═══ -->
     <header class="udh-hero">
       <div class="udh-hero__orb-a"></div>
       <div class="udh-hero__orb-b"></div>
       <div class="udh-hero__body">
         <div class="udh-hero__eyebrow">
           <span class="udh-tag">For You</span>
           <span class="udh-tag udh-tag--dim">{{ todayLabel() }}</span>
         </div>
         <h1 class="udh-hero__title">
           @if (user()?.firstName) {
             Hey, <em class="udh-em">{{ user()!.firstName }}</em>
           } @else { Welcome back }
         </h1>
         <p class="udh-hero__sub">
           @if (!loading() && totalEvents() > 0) {
             <strong class="udh-em">{{ totalEvents() }}</strong> events across
             <strong class="udh-em">{{ rows().length }}</strong> {{ rows().length === 1 ? 'genre' : 'genres' }} — curated for you.
           } @else if (loading()) {
             Loading your personalised feed…
           } @else {
             Explore events below.
           }
         </p>
       </div>
     </header>

     <!-- ═══ SPOTLIGHT BANNER ═══ -->
     @if (!loading() && spotlight()) {
       <div class="udh-spotlight-wrap">
         <div class="udh-spotlight" (click)="open(spotlight()!)">
           @if (spotlight()!.event_img_url) {
             <img [src]="spotlight()!.event_img_url" class="udh-spotlight__bg" [alt]="spotlight()!.title"/>
           } @else {
             <div class="udh-spotlight__bg udh-spotlight__bg--empty"></div>
           }
           <div class="udh-spotlight__scrim"></div>
           <div class="udh-spotlight__content">
             <div class="udh-spotlight__tags">
               <span class="udh-tag udh-tag--live"><span class="udh-pulse"></span>Upcoming</span>
               @if (spotlight()!.category?.name) {
                 <span class="udh-tag udh-tag--dim">{{ spotlight()!.category?.name }}</span>
               }
               @if (daysUntil(spotlight()!.start_time) !== null) {
                 <span class="udh-tag udh-tag--dim">
                   In {{ daysUntil(spotlight()!.start_time) }}d
                 </span>
               }
             </div>
             <h2 class="udh-spotlight__title">{{ spotlight()!.title }}</h2>
             <div class="udh-spotlight__meta">
               @if (spotlight()!.start_time) {
                 <span>
                   <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                   </svg>
                   {{ fmtDate(spotlight()!.start_time) }} · {{ fmtTime(spotlight()!.start_time) }}
                 </span>
               }
               @if (spotlight()!.city || spotlight()!.nameOfPlace) {
                 <span>
                   <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                   </svg>
                   {{ spotlight()!.nameOfPlace || spotlight()!.city }}
                 </span>
               }
             </div>
             <button class="udh-spotlight__btn" (click)="open(spotlight()!); $event.stopPropagation()">
               Get Tickets
               <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
               </svg>
             </button>
           </div>
         </div>
       </div>
     }

     @if (loading()) {
       <div class="udh-spotlight-wrap">
         <div class="udh-skel-hero"></div>
       </div>
     }

     <!-- ═══ SKELETON ROWS ═══ -->
     @if (loading()) {
       @for (n of [0,1,2]; track n) {
         <section class="udh-row">
           <div class="udh-row__head">
             <div class="udh-skel" style="width:3px;height:18px;border-radius:99px"></div>
             <div class="udh-skel" style="width:130px;height:16px;border-radius:6px"></div>
           </div>
           <div class="udh-row__track">
             @for (c of [0,1,2,3,4]; track c) {
               <div class="udh-skel-card" [style.animation-delay]="c*60+'ms'">
                 <div class="udh-skel" style="aspect-ratio:3/2;border-radius:0"></div>
                 <div style="padding:.75rem .85rem;display:flex;flex-direction:column;gap:.4rem">
                   <div class="udh-skel" style="height:10px;width:50%"></div>
                   <div class="udh-skel" style="height:14px;width:85%"></div>
                   <div class="udh-skel" style="height:10px;width:60%"></div>
                 </div>
               </div>
             }
           </div>
         </section>
       }

     } @else if (error()) {
       <div class="udh-empty">
         <p class="udh-empty__icon">⚠️</p>
         <p class="udh-empty__title">Couldn't load events</p>
         <button class="udh-btn" (click)="reload()">Retry</button>
       </div>

     } @else {

       <!-- ═══ CATEGORY ROWS ═══ -->
       @for (row of rows(); track row.cat.id; let ri = $index) {
         @if (row.events.length > 0) {
           <section class="udh-row" [style.--rc]="row.color">

             <!-- Row header -->
             <div class="udh-row__head">
               <span class="udh-row__bar"></span>
               <h2 class="udh-row__title">{{ row.cat.name }}</h2>
               <span class="udh-row__n">{{ row.events.length }}</span>
               <div class="udh-row__btns">
                 <button class="udh-row__btn" (click)="scrollRow(ri, -1)">
                   <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                   </svg>
                 </button>
                 <button class="udh-row__btn" (click)="scrollRow(ri, 1)">
                   <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                   </svg>
                 </button>
               </div>
             </div>

             <!-- Scrollable card track -->
             <div class="udh-row__track" #rowTrack>
               @for (ev of row.events; track ev.id; let i = $index) {
                 <article class="udh-card" [style.animation-delay]="i*40+'ms'" (click)="open(ev)">

                   <div class="udh-card__img-wrap">
                     @if (ev.event_img_url) {
                       <img [src]="ev.event_img_url" [alt]="ev.title" class="udh-card__img" loading="lazy"/>
                     } @else {
                       <div class="udh-card__noimg">
                         <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width=".8" viewBox="0 0 24 24" opacity=".2">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4M3 11h18"/>
                         </svg>
                       </div>
                     }
                     @if (isUpcoming(ev.start_time)) {
                       <span class="udh-card__dot"><span class="udh-mini-pulse"></span></span>
                     }
                     <div class="udh-card__grad"></div>
                   </div>

                   <div class="udh-card__body">
                     @if (ev.start_time) {
                       <div class="udh-card__date">{{ fmtDate(ev.start_time) }}</div>
                     }
                     <h3 class="udh-card__name">{{ ev.title }}</h3>
                     @if (ev.city || ev.nameOfPlace) {
                       <div class="udh-card__loc">
                         <svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                           <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                         </svg>
                         {{ ev.nameOfPlace || ev.city }}
                       </div>
                     }
                     <div class="udh-card__foot">
                       @if (ev.eventTickets?.length) {
                         <span class="udh-card__price">
                           @if (minPrice(ev) === 0) { Free } @else { EGP {{ minPrice(ev) | number:'1.0-0' }} }
                         </span>
                       }
                       <span class="udh-card__arrow">→</span>
                     </div>
                   </div>

                 </article>
               }
             </div>

           </section>
         }
       }

       @if (rows().length === 0) {
         <div class="udh-empty">
           <p class="udh-empty__icon">🎭</p>
           <p class="udh-empty__title">No events yet</p>
           <p class="udh-empty__sub">Check back soon.</p>
         </div>
       }
     }

     <div style="height:3rem"></div>
   </div>
 `,
 styles: [`
   :host {
     --gold:  #F0B429;
     --coral: #FF4433;
     --green: #22c55e;
     --bg:    #060608;
     --bg2:   #09090c;
     --bg3:   #111116;
     --text:  #F2EEE6;
     --muted: rgba(242,238,230,.42);
     --bdr:   rgba(242,238,230,.07);
     --hi:    rgba(242,238,230,.12);
     font-family: 'Plus Jakarta Sans', sans-serif;
     display: block; background: var(--bg); color: var(--text); min-height: 100%;
   }

   /* ─── SHARED TAGS ─── */
   .udh-tag {
     display: inline-flex; align-items: center; gap: 5px;
     padding: 3px 10px; border-radius: 100px;
     font-family: 'DM Mono', monospace; font-size: .59rem; letter-spacing: .12em; text-transform: uppercase;
     background: rgba(240,180,41,.1); border: 1px solid rgba(240,180,41,.2); color: var(--gold);
   }
   .udh-tag--dim  { background: rgba(242,238,230,.05); border-color: var(--bdr); color: var(--muted); }
   .udh-tag--live { background: rgba(34,197,94,.1);    border-color: rgba(34,197,94,.25); color: var(--green); }

   .udh-pulse { width:6px; height:6px; border-radius:50%; background:var(--green); display:inline-block; animation:pulse 1.4s ease-in-out infinite; }
   @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.6)} }
   .udh-em { color: var(--gold); font-style: normal; }

   /* ─── GREETING HERO ─── */
   .udh-hero {
     position: relative; overflow: hidden;
     padding: 2.5rem 1.75rem 2.25rem;
   }
   .udh-hero__orb-a, .udh-hero__orb-b {
     position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
   }
   .udh-hero__orb-a { width:400px;height:400px;top:-160px;right:-80px; background:radial-gradient(circle,rgba(240,180,41,.07) 0%,transparent 65%); }
   .udh-hero__orb-b { width:260px;height:260px;bottom:-80px;left:-50px; background:radial-gradient(circle,rgba(255,68,51,.05) 0%,transparent 65%); }
   .udh-hero__body  { position: relative; z-index: 1; }
   .udh-hero__eyebrow { display:flex;gap:.5rem;margin-bottom:.9rem; }
   .udh-hero__title {
     font-family: 'Bebas Neue', sans-serif;
     font-size: clamp(2.8rem, 7vw, 4.8rem);
     letter-spacing: .03em; line-height: .9; color: var(--text); margin: 0 0 .65rem;
   }
   .udh-hero__sub { font-size:.84rem;color:var(--muted);margin:0;font-weight:300;line-height:1.6; }

   /* ─── SPOTLIGHT ─── */
   .udh-spotlight-wrap { padding: 0 1.75rem 2.5rem; }
   .udh-spotlight {
     position: relative; border-radius: 20px; overflow: hidden; height: 340px;
     cursor: pointer; border: 1px solid var(--bdr);
     transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s;
   }
   .udh-spotlight:hover { transform: translateY(-3px); box-shadow: 0 24px 60px rgba(0,0,0,.6); }
   .udh-spotlight__bg {
     position: absolute; inset:0; width:100%; height:100%; object-fit:cover;
     transition: transform .6s cubic-bezier(.22,1,.36,1);
   }
   .udh-spotlight:hover .udh-spotlight__bg { transform: scale(1.05); }
   .udh-spotlight__bg--empty { background: var(--bg3); }
   .udh-spotlight__scrim {
     position: absolute; inset:0;
     background: linear-gradient(to right, rgba(6,6,8,.96) 0%, rgba(6,6,8,.7) 40%, rgba(6,6,8,.1) 100%);
   }
   .udh-spotlight__content {
     position: relative; z-index:1; padding:2rem 2.25rem;
     height:100%; display:flex; flex-direction:column; justify-content:flex-end; gap:.8rem; max-width:500px;
   }
   .udh-spotlight__tags  { display:flex;gap:.4rem;flex-wrap:wrap; }
   .udh-spotlight__title {
     font-family: 'Bebas Neue', sans-serif;
     font-size: clamp(1.7rem, 4vw, 2.6rem);
     letter-spacing:.03em; line-height:.95; color:var(--text); margin:0;
   }
   .udh-spotlight__meta {
     display:flex;gap:1rem;flex-wrap:wrap;
     font-size:.74rem; color:rgba(242,238,230,.6);
   }
   .udh-spotlight__meta span { display:inline-flex;align-items:center;gap:4px; }
   .udh-spotlight__btn {
     display:inline-flex;align-items:center;gap:.5rem;width:fit-content;
     padding:.65rem 1.35rem; border-radius:10px;
     background:var(--gold);color:#1a1200;border:none;
     font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;
     cursor:pointer;transition:box-shadow .25s,transform .2s;
     box-shadow: 0 0 24px rgba(240,180,41,.28);
   }
   .udh-spotlight__btn:hover { box-shadow:0 0 44px rgba(240,180,41,.5);transform:translateY(-2px); }

   .udh-skel-hero {
     height:340px; border-radius:20px;
     background:linear-gradient(90deg,rgba(242,238,230,.04) 25%,rgba(242,238,230,.07) 50%,rgba(242,238,230,.04) 75%);
     background-size:800px 100%; animation:shimmer 1.5s ease-in-out infinite;
   }
   @keyframes shimmer { from{background-position:-600px 0}to{background-position:600px 0} }

   /* ─── ROW ─── */
   .udh-row { --rc: var(--gold); position:relative; margin-bottom:2.5rem; }

   /* Soft right-fade edge */
   .udh-row::after {
     content:''; pointer-events:none;
     position:absolute; top:36px; right:0; bottom:0; width:56px;
     background:linear-gradient(to left, var(--bg) 0%, transparent 100%);
     z-index:2;
   }

   .udh-row__head {
     display:flex; align-items:center; gap:.7rem;
     padding:0 1.75rem .8rem;
   }
   .udh-row__bar  { width:3px;height:20px;border-radius:99px;background:var(--rc);flex-shrink:0; }
   .udh-row__title { font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.06em;color:var(--text);margin:0;flex:1; }
   .udh-row__n {
     font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.1em;color:var(--muted);
     padding:2px 7px;border-radius:100px;background:rgba(242,238,230,.05);border:1px solid var(--bdr);
   }
   .udh-row__btns { display:none;gap:.3rem; }
   @media(min-width:768px){ .udh-row__btns{display:flex;} }
   .udh-row__btn {
     width:28px;height:28px;border-radius:7px;flex-shrink:0;
     background:var(--bg3);border:1px solid var(--bdr);
     display:flex;align-items:center;justify-content:center;
     color:var(--muted);cursor:pointer;transition:all .2s;
   }
   .udh-row__btn:hover { background:var(--bg);border-color:var(--hi);color:var(--text); }

   /* ─── SCROLLABLE TRACK ─── */
   .udh-row__track {
     display:flex;gap:.8rem;overflow-x:auto;overflow-y:visible;
     padding:.2rem 1.75rem .9rem;
     scrollbar-width:none;scroll-behavior:smooth;
     scroll-snap-type:x mandatory;
   }
   .udh-row__track::-webkit-scrollbar { display:none; }

   /* ─── EVENT CARD ─── */
   .udh-card {
     flex-shrink:0; width:215px; border-radius:14px; overflow:hidden;
     background:var(--bg2); border:1px solid var(--bdr);
     cursor:pointer; position:relative;
     transition:transform .25s cubic-bezier(.22,1,.36,1),border-color .2s,box-shadow .2s;
     animation:cardIn .45s cubic-bezier(.22,1,.36,1) both;
     scroll-snap-align:start;
   }
   @keyframes cardIn { from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)} }
   .udh-card:hover {
     transform:translateY(-7px) scale(1.025);
     border-color:var(--hi);
     box-shadow:0 18px 44px rgba(0,0,0,.55);
     z-index:10;
   }

   .udh-card__img-wrap { position:relative;aspect-ratio:3/2;overflow:hidden;background:var(--bg3); }
   .udh-card__img { width:100%;height:100%;object-fit:cover;transition:transform .45s; }
   .udh-card:hover .udh-card__img { transform:scale(1.08); }
   .udh-card__noimg { width:100%;height:100%;display:flex;align-items:center;justify-content:center; }

   .udh-card__dot {
     position:absolute;top:.5rem;left:.5rem;
     width:8px;height:8px;border-radius:50%;
     background:var(--green); box-shadow:0 0 0 3px rgba(34,197,94,.2);
   }
   .udh-mini-pulse { display:block;width:100%;height:100%;border-radius:50%;background:var(--green);animation:pulse 1.4s ease-in-out infinite; }

   .udh-card__grad {
     position:absolute;inset:0;
     background:linear-gradient(to top,rgba(6,6,8,.65) 0%,transparent 55%);
     opacity:0;transition:opacity .3s;
   }
   .udh-card:hover .udh-card__grad { opacity:1; }

   .udh-card__body { padding:.72rem .85rem .82rem;display:flex;flex-direction:column;gap:.28rem; }
   .udh-card__date { font-family:'DM Mono',monospace;font-size:.57rem;letter-spacing:.1em;text-transform:uppercase;color:var(--rc,var(--gold)); }
   .udh-card__name {
     font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:.03em;
     color:var(--text);margin:0;line-height:1.1;
     display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
   }
   .udh-card__loc {
     display:flex;align-items:center;gap:3px;font-size:.66rem;color:var(--muted);
     white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
   }
   .udh-card__foot { display:flex;align-items:center;justify-content:space-between;margin-top:.3rem; }
   .udh-card__price { font-family:'DM Mono',monospace;font-size:.65rem;color:var(--gold);letter-spacing:.06em; }
   .udh-card__arrow { font-size:.7rem;font-weight:700;color:var(--rc,var(--gold));opacity:0;transform:translateX(-4px);transition:opacity .2s,transform .2s; }
   .udh-card:hover .udh-card__arrow { opacity:1;transform:translateX(0); }

   /* ─── SKELETONS ─── */
   .udh-skel {
     background:linear-gradient(90deg,rgba(242,238,230,.04) 25%,rgba(242,238,230,.07) 50%,rgba(242,238,230,.04) 75%);
     background-size:600px 100%;animation:shimmer 1.5s ease-in-out infinite;
   }
   .udh-skel-card { flex-shrink:0;width:215px;border-radius:14px;overflow:hidden;background:var(--bg2);border:1px solid var(--bdr);animation:fadeIn .5s both; }
   @keyframes fadeIn{from{opacity:0}to{opacity:1}}

   /* ─── EMPTY ─── */
   .udh-empty { display:flex;flex-direction:column;align-items:center;gap:.75rem;padding:5rem 1rem;text-align:center; }
   .udh-empty__icon { font-size:2.5rem; }
   .udh-empty__title { font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:.04em;color:var(--text);margin:0; }
   .udh-empty__sub   { font-size:.84rem;color:var(--muted);margin:0;font-weight:300; }
   .udh-btn { padding:.55rem 1.5rem;border-radius:10px;background:var(--gold);color:#1a1200;border:none;font-weight:700;font-size:.85rem;cursor:pointer; }

   /* ─── RESPONSIVE ─── */
   @media(max-width:640px){
     .udh-hero            { padding:1.75rem 1.1rem 1.5rem; }
     .udh-spotlight-wrap  { padding:0 1.1rem 2rem; }
     .udh-spotlight       { height:240px; }
     .udh-spotlight__content { padding:1.25rem 1.25rem; }
     .udh-row__head       { padding:0 1.1rem .6rem; }
     .udh-row__track      { padding:.2rem 1.1rem .8rem; }
     .udh-row::after      { width:30px; }
     .udh-card            { width:185px; }
   }
 `],
})
export class UserDashboardHome implements OnInit, OnDestroy {
 private readonly auth     = inject(AuthService);
 private readonly catSvc   = inject(CategoryService);
 private readonly eventSvc = inject(EventService);
 private readonly router   = inject(Router);
 private readonly destroy$ = new Subject<void>();

 @ViewChildren('rowTrack') rowTracks!: QueryList<ElementRef<HTMLDivElement>>;

 user    = signal(this.auth.getUserProfile());
 rows    = signal<CategoryRow[]>([]);
 loading = signal(true);
 error   = signal(false);

 totalEvents = computed(() => this.rows().reduce((n, r) => n + r.events.length, 0));

 spotlight = computed<EsEvent | null>(() => {
   const all = this.rows().flatMap(r => r.events);
   const up  = all
     .filter(e => isUpcoming(e.start_time))
     .sort((a, b) => +new Date(a.start_time!) - +new Date(b.start_time!));
   return up[0] ?? all[0] ?? null;
 });

 readonly fmtDate    = fmtDate;
 readonly fmtTime    = fmtTime;
 readonly isUpcoming = isUpcoming;
 readonly daysUntil  = daysUntil;

 todayLabel() {
   return new Date().toLocaleDateString('en-EG', { weekday: 'long', month: 'long', day: 'numeric' });
 }
 minPrice(ev: EsEvent) {
   if (!ev.eventTickets?.length) return 0;
   return Math.min(...ev.eventTickets.map(t => t.actualPrice ?? 0));
 }

 ngOnInit()    { this.loadData(); }
 ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
 reload()      { this.loadData(); }

 open(ev: EsEvent) { this.router.navigate(['/user-dashboard/events', ev.id]); }

 scrollRow(ri: number, dir: -1 | 1) {
   const el = this.rowTracks.toArray()[ri]?.nativeElement;
   if (el) el.scrollBy({ left: dir * 660, behavior: 'smooth' });
 }

 private loadData() {
   this.loading.set(true);
   this.error.set(false);
   const savedIds = this.auth.getSavedCategoryIds();

   this.catSvc.getAllCategories().pipe(
     catchError(() => of([] as Category[])),
     takeUntil(this.destroy$),
   ).subscribe(allCats => {
     const userCats = savedIds?.length
       ? allCats.filter(c => savedIds.includes(c.id))
       : allCats.slice(0, 8);

     if (userCats.length === 0) {
       this.eventSvc.getAllEvents().pipe(
         catchError(() => of([] as EsEvent[])), takeUntil(this.destroy$),
       ).subscribe(evs => {
         this.rows.set([{ cat: { id: -1, name: 'All Events' } as any, events: evs, color: ROW_COLORS[0] }]);
         this.loading.set(false);
       });
       return;
     }

     forkJoin(
       userCats.map(c => this.eventSvc.getEventsByCategory(c.id).pipe(catchError(() => of([] as EsEvent[]))))
     ).pipe(takeUntil(this.destroy$)).subscribe({
       next: results => {
         this.rows.set(userCats.map((cat, i) => ({
           cat,
           events: [...results[i]].sort((a, b) => {
             const d = (isUpcoming(b.start_time) ? 1 : 0) - (isUpcoming(a.start_time) ? 1 : 0);
             return d !== 0 ? d : +new Date(a.start_time ?? 0) - +new Date(b.start_time ?? 0);
           }),
           color: ROW_COLORS[i % ROW_COLORS.length],
         })));
         this.loading.set(false);
       },
       error: () => { this.error.set(true); this.loading.set(false); },
     });
   });
 }
}