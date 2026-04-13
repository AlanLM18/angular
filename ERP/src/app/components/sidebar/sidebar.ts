import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { PermissionsService } from '../../core/permissions';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TooltipModule, DividerModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  navItems = [
    { label: 'Dashboard', icon: 'pi pi-home',    route: '/home/dashboard', perm: null },
    { label: 'Grupos',    icon: 'pi pi-sitemap', route: '/home/groups',    perm: 'group:view' },
    { label: 'Usuarios',  icon: 'pi pi-users',   route: '/home/users',     perm: 'user:view' },
  ];

  constructor(
    public permissionsService: PermissionsService,
    private router: Router,
  ) {}

  toggle() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  canShow(perm: string | null): boolean {
    if (!perm) return true;
    return this.permissionsService.has(perm);
  }

  logout() {
    this.permissionsService.clear();
    this.router.navigate(['/login']);
  }
}
