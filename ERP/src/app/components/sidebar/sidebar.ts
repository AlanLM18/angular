import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  constructor(public permissionsService: PermissionsService) {}

  adminItems = [
    { label: 'Dashboard',  icon: 'pi pi-home',      route: '/home/dashboard',   perm: null },
    { label: 'Kanban',     icon: 'pi pi-th-large',  route: '/home/tickets',     perm: 'ticket:view' },
    { label: 'Lista',      icon: 'pi pi-list',       route: '/home/ticket-list', perm: 'ticket:view' },
    { label: 'Products',   icon: 'pi pi-box',        route: '/home/products',    perm: null },
  ];

  pageItems = [
    { label: 'Grupos',     icon: 'pi pi-sitemap',   route: '/home/groups',      perm: 'group:view' },
    { label: 'Usuarios',   icon: 'pi pi-users',     route: '/home/users',       perm: 'user:view' },
    { label: 'SuperAdmin', icon: 'pi pi-shield',    route: '/home/super-admin', perm: 'superadmin' },
  ];

  toggle() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  canShow(perm: string | null): boolean {
    if (!perm) return true;
    return this.permissionsService.has(perm as any);
  }
}
