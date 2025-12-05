// landing-navbar.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardMenuModule } from '@shared/components/menu/menu.module';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { AuthDialog } from '@features/auth/auth-dialog/auth-dialog';
import { DarkModeService } from '@core/services/darkmode.service';
import {
  faSun,
  faMoon,
  faChevronDown,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-landing-navbar',
  imports: [
    ZardMenuModule,
    ZardButtonComponent,
    ZardDividerComponent,
    FontAwesomeModule,
  ],
  templateUrl: './landing-navbar.html',
  styleUrl: './landing-navbar.css',
})
export class LandingNavbar {
  faSun = faSun;
  faMoon = faMoon;
  faChevronDown = faChevronDown;
  faBars = faBars;

  private readonly darkmodeService = inject(DarkModeService);
  private readonly dialogService = inject(ZardDialogService);
  private readonly router = inject(Router);

  activeMenu: 'products' | 'solutions' | 'resources' | null = null;

  ngOnInit(): void {
    this.updateActiveMenu();
  }

  updateActiveMenu(): void {
    const url = this.router.url;
    if (
      url.includes('analytics') ||
      url.includes('dashboard') ||
      url.includes('reports')
    ) {
      this.activeMenu = 'products';
    } else if (url.includes('startups') || url.includes('enterprise')) {
      this.activeMenu = 'solutions';
    } else if (
      url.includes('blog') ||
      url.includes('documentation') ||
      url.includes('community')
    ) {
      this.activeMenu = 'resources';
    } else {
      this.activeMenu = null;
    }
  }

  isMenuActive(menu: 'products' | 'solutions' | 'resources'): boolean {
    return this.activeMenu === menu;
  }

  toggleTheme(): void {
    this.darkmodeService.toggleTheme();
  }

  getCurrentTheme(): 'light' | 'dark' {
    const theme = this.darkmodeService.getCurrentTheme();
    return theme === 'light' || theme === 'dark' ? theme : 'light';
  }

  // landing-navbar.ts
  openGetStartedDialog(): void {
    // Change from dialogService.open() to dialogService.create()
    this.dialogService.create({
      zContent: AuthDialog,
      zWidth: '425px'
    });
  }

  log(item: string): void {
    console.log('Navigate to:', item);
  }
}
