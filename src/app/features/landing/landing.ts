import {
  Component,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { LandingNavbar } from '@core/layout/landing-navbar/landing-navbar';
import { DarkModeService } from '@core/services/darkmode.service';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { AuthDialog } from '@features/auth/auth-dialog/auth-dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faCalendar,
  faLocationDot,
  faUsers,
  faTicket,
} from '@fortawesome/free-solid-svg-icons';

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LandingNavbar, FontAwesomeModule],
  template: `
    <div
      class="main-container bg-white dark:bg-black text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300"
    >
      <app-landing-navbar class="fixed top-0 w-full z-50"></app-landing-navbar>

      <section
        class="hero-section relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden"
      >
        <div class="absolute inset-0 pointer-events-none">
          <div
            class="blob blob-1 absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
          ></div>
          <div
            class="blob blob-2 absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
          ></div>
          <div
            class="blob blob-3 absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-red-500/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
          ></div>
        </div>

        <div class="hero-content relative z-10 max-w-7xl mx-auto text-center">
          <div
            class="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-8 opacity-0 translate-y-4"
          >
            <span class="pulse-dot w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-sm font-medium tracking-wide">
              15,000+ events live across Egypt
            </span>
          </div>

          <h1
            class="hero-title text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.9] mb-8"
          >
            <div class="line-mask overflow-hidden">
              <span class="hero-text block transform translate-y-full"
                >Uncover</span
              >
            </div>
            <div class="line-mask overflow-hidden">
              <span
                class="hero-text block transform translate-y-full bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent"
                >Egypt's Pulse</span
              >
            </div>
            <div class="line-mask overflow-hidden">
              <span class="hero-text block transform translate-y-full"
                >Live Events</span
              >
            </div>
          </h1>

          <p
            class="hero-desc text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 opacity-0 translate-y-4 leading-relaxed"
          >
            The modern platform for creators, organizers, and communities
            building the next generation of experiences in Cairo, Giza, and
            Alexandria.
          </p>

          <div
            class="hero-cta flex flex-wrap gap-4 justify-center opacity-0 translate-y-4"
          >
            <button
              (click)="handleHostEventClick()"
              class="group relative px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105"
            >
              <span class="relative z-10 flex items-center gap-2">
                Start Hosting
                <fa-icon
                  [icon]="faArrowRight"
                  class="group-hover:translate-x-1 transition-transform"
                ></fa-icon>
              </span>
            </button>
            <button
              class="px-8 py-4 border border-gray-200 dark:border-white/20 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Find Events
            </button>
          </div>
        </div>

        <div
          class="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0"
        >
          <span class="text-xs uppercase tracking-widest text-gray-400"
            >Scroll</span
          >
          <div
            class="w-[1px] h-12 bg-gradient-to-b from-gray-400 to-transparent"
          ></div>
        </div>
      </section>

      <section class="featured-section py-32 px-6">
        <div class="max-w-7xl mx-auto">
          <div class="section-header mb-20">
            <h2
              class="section-title text-4xl md:text-6xl font-bold mb-4 opacity-0 translate-y-10"
            >
              Trending Now in Egypt
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div
              *ngFor="let event of suggestedEvents; let i = index"
              class="event-card group relative cursor-pointer opacity-0 translate-y-20"
            >
              <div
                class="image-wrapper relative aspect-[4/5] overflow-hidden rounded-2xl mb-6"
              >
                <img
                  *ngIf="i === 0"
                  src="https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Concert stage with lights near the pyramids at night"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <img
                  *ngIf="i === 1"
                  src="https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="People celebrating at a desert oasis festival"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <img
                  *ngIf="i === 2"
                  src="https://images.pexels.com/photos/1181400/pexels-photo-1181400.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Modern tech conference with big screen and attendees"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div
                  class="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"
                ></div>

                <div
                  class="absolute top-4 right-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-sm"
                >
                  {{ event.price }}
                </div>
              </div>

              <div class="card-content">
                <div
                  class="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium mb-2 text-sm uppercase tracking-wider"
                >
                  <fa-icon [icon]="faCalendar"></fa-icon>
                  {{ event.date }}
                </div>
                <h3
                  class="text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4"
                >
                  {{ event.title }}
                </h3>
                <p
                  class="text-gray-500 dark:text-gray-400 flex items-center gap-2"
                >
                  <fa-icon [icon]="faLocationDot"></fa-icon>
                  {{ event.location }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="horizontal-wrapper relative h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden flex flex-col justify-center"
      >
        <div class="absolute top-12 left-6 md:left-20 z-10">
          <h2
            class="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-600"
          >
            DISCOVER<br />NEARBY GEMS
          </h2>
        </div>

        <div
          class="horizontal-track flex gap-8 px-6 md:px-20 w-max items-center"
        >
          <div class="w-[30vw] md:w-[20vw] shrink-0"></div>

          <div
            *ngFor="let event of nearbyEvents; let i = index"
            class="nearby-card relative w-[85vw] md:w-[400px] h-[60vh] md:h-[500px] rounded-3xl overflow-hidden shrink-0 transition-all duration-500 hover:scale-[1.02]"
          >
            <img
              *ngIf="i === 0"
              src="https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Bustling rooftop cafe in Downtown Cairo at night"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <img
              *ngIf="i === 1"
              src="https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Snorkeling in clear Red Sea water near coral reef"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <img
              *ngIf="i === 2"
              src="https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Colorful lanterns and shops in a Middle Eastern market"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <img
              *ngIf="i === 3"
              src="https://images.pexels.com/photos/460740/pexels-photo-460740.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Panoramic view over Cairo from a hill at sunset"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <img
              *ngIf="i === 4"
              src="https://images.pexels.com/photos/460680/pexels-photo-460680.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Colorful houses in a village by the Nile in Upper Egypt"
              class="absolute inset-0 w-full h-full object-cover"
            />

            <div
              class="absolute inset-0 p-8 flex flex-col justify-between text-white bg-gradient-to-t from-black/80 via-transparent to-transparent"
            >
              <div class="flex justify-between items-start">
                <span
                  class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase border border-white/10"
                >
                  {{ event.distance }} Away
                </span>
              </div>

              <div>
                <h3 class="text-3xl font-bold mb-2 leading-tight">
                  {{ event.title }}
                </h3>
                <div class="flex items-center gap-4 text-white/80 text-sm">
                  <span>{{ event.date }}</span>
                  <span class="w-1 h-1 bg-white rounded-full"></span>
                  <button class="font-bold hover:text-white transition-colors">
                    Learn More &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="w-[10vw] shrink-0"></div>
        </div>
      </section>

      <!-- CTA SECTION - BLACK & WHITE ONLY -->
      <section
        class="cta-section relative py-40 px-6 flex items-center justify-center overflow-hidden"
      >
        <div
          class="absolute inset-0 bg-black dark:bg-white transform origin-bottom scale-y-0 cta-bg"
        ></div>

        <div class="relative z-10 text-center max-w-4xl mx-auto">
          <h2
            class="cta-title text-5xl md:text-8xl font-black mb-8 leading-none opacity-0 translate-y-10 text-white dark:text-black"
          >
            Your Event Starts Now.
          </h2>
          <p
            class="cta-text text-xl md:text-2xl text-white/90 dark:text-black/80 mb-12 opacity-0 translate-y-10"
          >
            Join the community of Egyptian creators organizing unforgettable
            experiences.
          </p>
          <button
            (click)="handleHostEventClick()"
            class="cta-btn px-10 py-5 bg-white dark:bg-black text-black dark:text-white border-2 border-white dark:border-black rounded-full font-bold text-xl hover:scale-110 transition-transform opacity-0 scale-50"
          >
            Create Event
          </button>
        </div>
      </section>

    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* Smooth Pulse Animation */
      .pulse-dot {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulse-green 2s infinite;
      }

      @keyframes pulse-green {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }
    `,
  ],
})
export class LandingComponent implements AfterViewInit, OnInit, OnDestroy {
  private readonly darkmodeService = inject(DarkModeService);
  private readonly dialogService = inject(ZardDialogService);
  private readonly platformId = inject(PLATFORM_ID);

  // Placeholder for user login status (would come from an Auth service)
  isUserLoggedIn: boolean = false;

  private ctx?: gsap.Context;

  faArrowRight = faArrowRight;
  faCalendar = faCalendar;
  faLocationDot = faLocationDot;
  faUsers = faUsers;
  faTicket = faTicket;

  currentYear = new Date().getFullYear();

  suggestedEvents = [
    {
      title: 'SOUNDSTORM Giza Edition',
      gradient: 'from-amber-500 to-red-600',
      date: 'Dec 15',
      location: 'Near The Pyramids, Giza',
      price: 'EGP 1500',
    },
    {
      title: 'Siwa Cultural Festival',
      gradient: 'from-blue-500 to-cyan-600',
      date: 'Dec 20',
      location: 'Siwa Oasis, Matrouh',
      price: 'EGP 450',
    },
    {
      title: 'Tech Leaders Summit Cairo',
      gradient: 'from-purple-500 to-indigo-600',
      date: 'Dec 25',
      location: 'New Cairo',
      price: 'EGP 999',
    },
  ];

  nearbyEvents = [
    {
      title: 'Tahrir Square Guided Tour',
      distance: '0.5 km',
      date: 'Tonight',
      gradient: 'from-amber-400 to-orange-600',
    },
    {
      title: 'Zamalek Rooftop Jazz',
      distance: '1.2 km',
      date: 'Sat, 8:00 PM',
      gradient: 'from-emerald-400 to-teal-600',
    },
    {
      title: 'Khan el-Khalili Night Walk',
      distance: '2.5 km',
      date: 'Sunday',
      gradient: 'from-purple-400 to-pink-600',
    },
    {
      title: 'Old Cairo Food Tasting',
      distance: '3.1 km',
      date: 'Friday',
      gradient: 'from-rose-400 to-red-600',
    },
    {
      title: 'Nile Felucca Sunset Ride',
      distance: '5.0 km',
      date: 'Daily',
      gradient: 'from-blue-400 to-indigo-600',
    },
  ];

  ngOnInit(): void {
    // Initializes the theme based on system preference or saved setting
    this.darkmodeService.initTheme();
    // In a real app, you would check auth status here
    // this.isUserLoggedIn = this.authService.isLoggedIn();
  }

  // Handles click for "Start Hosting" and "Create Event" buttons
  handleHostEventClick(): void {
    if (this.isUserLoggedIn) {
      // Redirect to event creation dashboard if logged in (Placeholder)
      // this.router.navigate(['/dashboard/create-event']);
      console.log('User is logged in, redirecting to event creation.');
    } else {
      // Open auth dialog if not logged in
      this.dialogService.create({
        zContent: AuthDialog,
        zWidth: '425px',
      });
      console.log('User is NOT logged in, opening AuthDialog.');
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ctx = gsap.context(() => {
      // 1. HERO ANIMATIONS
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 })
        .to(
          '.hero-text',
          { y: '0%', stagger: 0.15, duration: 1.2, ease: 'power4.out' },
          '-=0.4'
        )
        .to('.hero-desc', { opacity: 1, y: 0, duration: 0.8 }, '-=0.8')
        .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .to('.scroll-indicator', { opacity: 1, duration: 0.8 }, '-=0.4');

      // 2. PARALLAX BLOBS (Mouse Movement)
      window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        gsap.to('.blob-1', {
          x: x * 50,
          y: y * 50,
          duration: 2,
          ease: 'power1.out',
        });
        gsap.to('.blob-2', {
          x: -x * 50,
          y: -y * 50,
          duration: 2,
          ease: 'power1.out',
        });
      });

      // 3. FEATURED CARDS (Staggered Reveal)
      ScrollTrigger.batch('.event-card', {
        start: 'top 85%',
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.8,
            ease: 'back.out(1.7)',
          }),
        once: true,
      });

      // 4. SECTION HEADER REVEAL
      gsap.to('.section-title', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: '.featured-section',
          start: 'top 70%',
          once: true,
        },
      });

      // 5. HORIZONTAL SCROLL (The "Pin" Effect)
      const track = document.querySelector(
        '.horizontal-track'
      ) as HTMLElement | null;
      const sections = gsap.utils.toArray('.nearby-card');

      if (track && sections.length > 1) {
        const scrollDistance = track.scrollWidth - window.innerWidth;
        gsap.to(track, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            trigger: '.horizontal-wrapper',
            pin: true,
            scrub: 1,
            snap: 1 / (sections.length - 1),
            end: () => '+=' + track.scrollWidth,
          },
        });
      }

      // 6. FOOTER CTA (Reveal Effect)
      const ctaTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 70%',
          toggleActions: 'play none none reverse',
          once: true,
        },
      });

      ctaTl
        .to('.cta-bg', { scaleY: 1, duration: 0.8, ease: 'power4.inOut' })
        .to('.cta-title', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .to('.cta-text', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .to(
          '.cta-btn',
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' },
          '-=0.3'
        );
    });
  }

  ngOnDestroy() {
    this.ctx?.revert();
  }
}
