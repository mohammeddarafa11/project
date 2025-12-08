import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DarkModeService } from '@core/services/darkmode.service';

import { LayoutModule } from '@shared/components/layout/layout.module';
import { ZardAvatarComponent } from '@shared/components/avatar/avatar.component';
import { ZardBreadcrumbModule } from '@shared/components/breadcrumb/breadcrumb.module';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardMenuModule } from '@shared/components/menu/menu.module';
import { ZardSkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { ZardTooltipDirective } from '@shared/components/tooltip/tooltip'; 

interface MenuItem {
  icon: ZardIcon;
  label: string;
  submenu?: { label: string }[];
}

@Component({
  selector: 'app-dashboard',
  imports: [
    LayoutModule,
    ZardAvatarComponent,
    ZardBreadcrumbModule,
    ZardButtonComponent,
    ZardDividerComponent,
    ZardIconComponent,
    ZardMenuModule,
    ZardSkeletonComponent,
    ZardTooltipDirective,  // ✅ Tooltip directive
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: true,
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly darkModeService = inject(DarkModeService);
  
  readonly sidebarCollapsed = signal(false);

  mainMenuItems: MenuItem[] = [
    { icon: 'house' as ZardIcon, label: 'Home' },
    { icon: 'inbox' as ZardIcon, label: 'Inbox' },
  ];

  workspaceMenuItems: MenuItem[] = [
    {
      icon: 'folder' as ZardIcon,
      label: 'Projects',
      submenu: [{ label: 'Design System' }, { label: 'Mobile App' }, { label: 'Website' }],
    },
    { icon: 'calendar' as ZardIcon, label: 'Calendar' },
    { icon: 'search' as ZardIcon, label: 'Search' },
  ];

  toggleSidebar() {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  onCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed.set(collapsed);
  }

  toggleTheme() {
    this.darkModeService.toggleTheme();
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}
