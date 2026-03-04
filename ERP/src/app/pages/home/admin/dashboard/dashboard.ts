import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {
  stats = [
    { label: 'Total Users',    value: '1,284', icon: 'pi pi-users',      color: 'blue',   change: '+8%'  },
    { label: 'Total Groups',   value: '42',    icon: 'pi pi-sitemap',    color: 'purple', change: '+3%'  },
    { label: 'Total Products', value: '863',   icon: 'pi pi-box',        color: 'green',  change: '+12%' },
  ];
}
