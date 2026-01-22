// src/app/shared/components/app-sidebar/app-sidebar.component.ts
import { Component, input, output, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DarkModeService } from '@core/services/darkmode.service';
import { LayoutModule } from '@shared/components/layout/layout.module';
import { ZardAvatarComponent } from '@shared/components/avatar/avatar.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardMenuModule } from '@shared/components/menu/menu.module';
import { ZardTooltipDirective } from '@shared/components/tooltip/tooltip';
import { AuthService } from '../../../core/services/auth.service';

export interface MenuItem {
  icon: ZardIcon;
  label: string;
  route?: string;
  submenu?: { label: string; route?: string }[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    LayoutModule,
    ZardAvatarComponent,
    ZardButtonComponent,
    ZardDividerComponent,
    ZardIconComponent,
    ZardMenuModule,
    ZardTooltipDirective,
  ],
  templateUrl: './app-sidebar.component.html',
  standalone: true,
})
export class AppSidebarComponent {
  collapsed = input<boolean>(false);
  collapsedChange = output<boolean>();

  // ✅ Add computed icon based on current theme
  themeIcon = computed(() => {
    const isDark = this.darkModeService.isCurrentlyDark();
    return (isDark ? 'sun' : 'moon') as ZardIcon;
  });

  mainMenuItems: MenuItem[] = [
    { icon: 'house' as ZardIcon, label: 'Home', route: '/dashboard' },
    // { icon: 'inbox' as ZardIcon, label: 'Inbox', route: '/inbox' },
  ];

  workspaceMenuItems: MenuItem[] = [
    {
      icon: 'calendar' as ZardIcon,
      label: 'Events',
      submenu: [
        { label: 'All Events', route: '/events' },
        { label: 'Create Event', route: '/events/create' },
      ],
    },
    // { icon: 'folder' as ZardIcon, label: 'Categories', route: '/categories' },
    // { icon: 'search' as ZardIcon, label: 'Search', route: '/search' },
  ];

  constructor(
    private router: Router,
    private darkModeService: DarkModeService,
    private authService: AuthService,
  ) {}

  navigateTo(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  toggleTheme() {
    this.darkModeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
