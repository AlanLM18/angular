import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent {
  today = new Date();

  summary = [
    { label: 'Total Users',    value: '1,284', icon: 'pi pi-users',      color: 'blue',   route: '/home/users'     },
    { label: 'Total Groups',   value: '42',    icon: 'pi pi-sitemap',    color: 'purple', route: '/home/groups'    },
    { label: 'Total Products', value: '863',   icon: 'pi pi-box',        color: 'green',  route: '/home/products'  },
    { label: 'Dashboard',      value: 'Ver',   icon: 'pi pi-chart-line', color: 'orange', route: '/home/dashboard' },
  ];
}
