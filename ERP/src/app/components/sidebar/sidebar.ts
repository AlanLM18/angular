import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

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

  adminItems = [
    { label: 'Dashboard',  icon: 'pi pi-home',      route: '/home/dashboard' },
    { label: 'Products',   icon: 'pi pi-box',        route: '/home/products'  },
  ];

  pageItems = [
    { label: 'Users',      icon: 'pi pi-users',      route: '/home/users'  },
    { label: 'Groups',     icon: 'pi pi-sitemap',    route: '/home/groups' },
  ];

  toggle() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
