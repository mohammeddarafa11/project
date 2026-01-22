import {
  Component,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  AfterViewChecked,
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

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LandingNavbar, FontAwesomeModule],
  template: `
    <div
      class="main-container bg-white dark:bg-black text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300"
    >
      <!-- NAVBAR -->
      <app-landing-navbar class="fixed top-0 w-full z-50"></app-landing-navbar>

      <!-- HERO SECTION -->
      <section
        class="hero-section relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-20 overflow-hidden"
      >
        <!-- Animated Blobs Background -->
        <div class="absolute inset-0 pointer-events-none">
          <div
            class="blob blob-1 absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full bg-amber-500/20 blur-[80px] lg:blur-[100px] mix-blend-multiply dark:mix-blend-screen"
          ></div>
          <div
            class="blob blob-2 absolute top-[20%] right-[-10%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] rounded-full bg-indigo-500/20 blur-[80px] lg:blur-[100px] mix-blend-multiply dark:mix-blend-screen"
          ></div>
          <div
            class="blob blob-3 absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full bg-red-500/20 blur-[80px] lg:blur-[100px] mix-blend-multiply dark:mix-blend-screen"
          ></div>
        </div>

        <div
          class="hero-content relative z-10 max-w-7xl mx-auto text-center w-full"
        >
          <!-- Live Badge -->
          <div
            class="hero-badge inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-6 sm:mb-8 opacity-0 translate-y-4"
          >
            <span class="pulse-dot w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs sm:text-sm font-medium tracking-wide">
              15,000+ events live across Egypt
            </span>
          </div>

          <!-- Hero Title -->
          <h1
            class="hero-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight leading-[0.9] mb-6 sm:mb-8 px-4"
          >
            <div class="line-mask overflow-hidden">
              <span class="hero-text block transform translate-y-full"
                >Uncover</span
              >
            </div>
            <div class="line-mask overflow-hidden">
              <span
                class="hero-text block transform translate-y-full bg-gradient-to-r from-blue-400 to-amber-300 bg-clip-text text-transparent"
              >
                Egypt's Pulse
              </span>
            </div>
            <div class="line-mask overflow-hidden">
              <span class="hero-text block transform translate-y-full"
                >Live Events</span
              >
            </div>
          </h1>

          <!-- Hero Description -->
          <p
            class="hero-desc text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-12 opacity-0 translate-y-4 leading-relaxed px-4"
          >
            The modern platform for creators, organizers, and communities
            building the next generation of experiences in Cairo, Giza, and
            Alexandria.
          </p>

          <!-- CTA Buttons -->
          <div
            class="hero-cta flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center opacity-0 translate-y-4 px-4"
          >
            <button
              (click)="handleHostEventClick()"
              class="group relative px-6 sm:px-8 py-3 sm:py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-base sm:text-lg overflow-hidden transition-transform hover:scale-105 w-full sm:w-auto"
            >
              <span
                class="relative z-10 flex items-center justify-center gap-2"
              >
                Start Hosting
                <fa-icon
                  [icon]="faArrowRight"
                  class="group-hover:translate-x-1 transition-transform"
                ></fa-icon>
              </span>
            </button>
            <button
              class="px-6 sm:px-8 py-3 sm:py-4 border border-gray-200 dark:border-white/20 rounded-full font-bold text-base sm:text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full sm:w-auto"
            >
              Find Events
            </button>
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div
          class="scroll-indicator absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 hidden sm:flex"
        >
          <span class="text-xs uppercase tracking-widest text-gray-400"
            >Scroll</span
          >
          <div
            class="w-[1px] h-10 sm:h-12 bg-gradient-to-b from-gray-400 to-transparent"
          ></div>
        </div>
      </section>

      <!-- FEATURED EVENTS SECTION -->
      @defer (on viewport) {
        <section
          class="featured-section py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8"
        >
          <div class="max-w-7xl mx-auto">
            <!-- Section Header -->
            <div
              class="section-header mb-12 sm:mb-16 lg:mb-20 text-center sm:text-left"
            >
              <h2
                class="section-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 opacity-0 translate-y-10"
              >
                Trending Now in Egypt
              </h2>
              <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Discover the hottest events happening right now
              </p>
            </div>

            <!-- Events Grid -->
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <div
                *ngFor="let event of suggestedEvents; let i = index"
                class="event-card group relative cursor-pointer opacity-0 translate-y-20"
              >
                <!-- Image -->
                <div
                  class="image-wrapper relative aspect-[4/5] overflow-hidden rounded-xl sm:rounded-2xl mb-4 sm:mb-6"
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

                  <!-- Price Badge -->
                  <div
                    class="absolute top-3 sm:top-4 right-3 sm:right-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-xs sm:text-sm"
                  >
                    {{ event.price }}
                  </div>
                </div>

                <!-- Card Content -->
                <div class="card-content px-1">
                  <div
                    class="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium mb-2 text-xs sm:text-sm uppercase tracking-wider"
                  >
                    <fa-icon [icon]="faCalendar" class="text-sm"></fa-icon>
                    {{ event.date }}
                  </div>
                  <h3
                    class="text-xl sm:text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4 leading-tight"
                  >
                    {{ event.title }}
                  </h3>
                  <p
                    class="text-sm sm:text-base text-gray-500 dark:text-gray-400 flex items-center gap-2"
                  >
                    <fa-icon [icon]="faLocationDot" class="text-sm"></fa-icon>
                    {{ event.location }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      } @placeholder {
        <div
          class="h-[400px] sm:h-[600px] w-full flex items-center justify-center text-gray-500"
        >
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"
            ></div>
            <p>Loading Featured Events...</p>
          </div>
        </div>
      }

      <!-- HORIZONTAL NEARBY GEMS SECTION -->
      @defer (on viewport) {
        <section
          class="horizontal-wrapper relative min-h-[70vh] sm:min-h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden flex flex-col justify-center py-12 sm:py-0"
        >
          <!-- Title -->
          <div
            class="absolute top-8 sm:top-12 left-4 sm:left-6 md:left-12 lg:left-20 z-10"
          >
            <h2
              class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-600 leading-tight"
            >
              DISCOVER<br />NEARBY GEMS
            </h2>
          </div>

          <!-- Scrollable Track -->
          <div
            class="horizontal-track flex gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 md:px-12 lg:px-20 w-max items-center"
          >
            <!-- Spacer -->
            <div class="w-[10vw] sm:w-[20vw] lg:w-[30vw] shrink-0"></div>

            <!-- Cards -->
            <div
              *ngFor="let event of nearbyEvents; let i = index"
              class="nearby-card relative w-[90vw] sm:w-[70vw] md:w-[500px] lg:w-[400px] h-[50vh] sm:h-[60vh] md:h-[500px] rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 transition-all duration-500 hover:scale-[1.02]"
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

              <!-- Card Overlay Content -->
              <div
                class="absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col justify-between text-white bg-gradient-to-t from-black/80 via-transparent to-transparent"
              >
                <!-- Distance Badge -->
                <div class="flex justify-between items-start">
                  <span
                    class="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase border border-white/10"
                  >
                    {{ event.distance }} Away
                  </span>
                </div>

                <!-- Event Info -->
                <div>
                  <h3 class="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                    {{ event.title }}
                  </h3>
                  <div
                    class="flex flex-wrap items-center gap-2 sm:gap-4 text-white/80 text-xs sm:text-sm"
                  >
                    <span>{{ event.date }}</span>
                    <span
                      class="w-1 h-1 bg-white rounded-full hidden sm:block"
                    ></span>
                    <button
                      class="font-bold hover:text-white transition-colors"
                    >
                      Learn More &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- End Spacer -->
            <div class="w-[5vw] sm:w-[10vw] shrink-0"></div>
          </div>
        </section>
      } @placeholder {
        <div
          class="min-h-[70vh] sm:min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center text-gray-500"
        >
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"
            ></div>
            <p>Preparing Nearby Gems...</p>
          </div>
        </div>
      }

      <!-- CTA & FOOTER SECTIONS -->
      @defer (on viewport) {
        <!-- CTA SECTION -->
        <section
          class="cta-section relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-black dark:bg-white transform origin-bottom scale-y-0 cta-bg"
          ></div>

          <div class="relative z-10 text-center max-w-4xl mx-auto">
            <h2
              class="cta-title text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 sm:mb-8 leading-none opacity-0 translate-y-10 text-white dark:text-black px-4"
            >
              Your Event Starts Now.
            </h2>
            <p
              class="cta-text text-lg sm:text-xl md:text-2xl text-white/90 dark:text-black/80 mb-8 sm:mb-12 opacity-0 translate-y-10 px-4"
            >
              Join the community of Egyptian creators organizing unforgettable
              experiences.
            </p>
            <button
              (click)="handleHostEventClick()"
              class="cta-btn px-8 sm:px-10 py-4 sm:py-5 bg-white dark:bg-black text-black dark:text-white border-2 border-white dark:border-black rounded-full font-bold text-lg sm:text-xl hover:scale-110 transition-transform opacity-0 scale-50"
            >
              Create Event
            </button>
          </div>
        </section>

        <!-- FOOTER -->
        <footer
          class="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white text-xs sm:text-sm"
        >
          <div
            class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-3"
          >
            <span
              class="font-bold text-black dark:text-white text-center sm:text-left"
            >
              © {{ currentYear }} EventOS. All rights reserved.
            </span>
            <div
              class="flex gap-4 sm:gap-6 text-xs font-medium flex-wrap justify-center"
            >
              <a
                href="#"
                class="hover:underline text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                class="hover:underline text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                class="hover:underline text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </footer>
      } @placeholder {
        <div
          class="h-[200px] w-full flex items-center justify-center text-gray-500"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"
          ></div>
        </div>
      }
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

      /* Prevent horizontal overflow on small screens */
      .horizontal-track {
        -webkit-overflow-scrolling: touch;
      }
    `,
  ],
})
export class LandingComponent
  implements AfterViewInit, OnInit, OnDestroy, AfterViewChecked
{
  // Added AfterViewChecked
  private readonly darkmodeService = inject(DarkModeService);
  private readonly dialogService = inject(ZardDialogService);
  private readonly platformId = inject(PLATFORM_ID);

  isUserLoggedIn: boolean = false;

  private ctx?: gsap.Context;

  // Initialization flags to track which deferred sections have had their GSAP code run
  private featuredInitialized = false;
  private horizontalInitialized = false;
  private ctaInitialized = false;

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
    this.darkmodeService.initTheme();
  }

  handleHostEventClick(): void {
    if (this.isUserLoggedIn) {
      console.log('User is logged in, redirecting to event creation.');
    } else {
      this.dialogService.create({
        zContent: AuthDialog,
        zWidth: '425px',
      });
      console.log('User is NOT logged in, opening AuthDialog.');
    }
  }

  // Eagerly loaded animations for the Hero section (runs once after initial view)
  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ctx = gsap.context(() => {
      // 1. HERO ANIMATIONS
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 })
        .to(
          '.hero-text',
          { y: '0%', stagger: 0.15, duration: 1.2, ease: 'power4.out' },
          '-=0.4',
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
    });
  }

  /**
   * Checks if deferred content is loaded and initializes GSAP for that section.
   * Runs frequently, so checks must be efficient.
   */
  ngAfterViewChecked(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Check Featured Section
    if (!this.featuredInitialized) {
      const featuredElement = document.querySelector('.featured-section');
      if (featuredElement) {
        this.initFeaturedAnimations();
        this.featuredInitialized = true;
      }
    }

    // 2. Check Horizontal Scroll Section
    if (!this.horizontalInitialized) {
      const horizontalElement = document.querySelector('.horizontal-wrapper');
      if (horizontalElement) {
        this.initHorizontalScroll();
        this.horizontalInitialized = true;
      }
    }

    // 3. Check CTA Section
    if (!this.ctaInitialized) {
      const ctaElement = document.querySelector('.cta-section');
      if (ctaElement) {
        this.initCtaAnimation();
        this.ctaInitialized = true;
      }
    }
  }

  // --- GSAP Initialization Methods (Called after DOM check) ---

  /**
   * Initializes GSAP animations for the Featured Events section.
   */
  initFeaturedAnimations() {
    console.log(
      'GSAP: Initializing Featured Animations (Deferred content loaded).',
    );
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
  }

  /**
   * Initializes GSAP animations for the Horizontal Scroll section.
   */
  initHorizontalScroll() {
    console.log(
      'GSAP: Initializing Horizontal Scroll (Deferred content loaded).',
    );
    // 5. HORIZONTAL SCROLL (The "Pin" Effect)
    const track = document.querySelector(
      '.horizontal-track',
    ) as HTMLElement | null;
    const sections = gsap.utils.toArray('.nearby-card');

    if (track && sections.length > 1) {
      // Calculate scroll distance based on the width of all cards plus gaps
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
  }

  /**
   * Initializes GSAP animations for the CTA section.
   */
  initCtaAnimation() {
    console.log('GSAP: Initializing CTA Animation (Deferred content loaded).');
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
        '-=0.3',
      );
  }

  ngOnDestroy() {
    // Revert the main GSAP context (for hero/blobs)
    this.ctx?.revert();
    // Kill all ScrollTriggers created in the defer blocks to prevent memory leaks
    ScrollTrigger.getAll().forEach((st) => st.kill());
  }
}
