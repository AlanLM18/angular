import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../../core/api.service';
import { PermissionsService } from '../../../../core/permissions';
import { TicketStatus, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SelectModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  groups:       any[] = [];
  tickets:      any[] = [];
  selectedGroup: any  = null;
  groupOptions: any[] = [];
  loading = false;

  // Stats
  totalTickets  = 0;
  byStatus:    { label: string; count: number; color: string; pct: number }[] = [];
  byPriority:  { label: string; count: number; color: string; pct: number }[] = [];
  recentTickets: any[] = [];

  statusColors: Record<string, string> = {
    'Pendiente':   '#94a3b8',
    'En progreso': '#3b82f6',
    'Revisión':    '#f59e0b',
    'Hecho':       '#22c55e',
    'Bloqueado':   '#ef4444',
  };

  priorityColors: Record<string, string> = {
    'Crítica':    '#dc2626',
    'Alta':       '#f97316',
    'Media-Alta': '#f59e0b',
    'Media':      '#3b82f6',
    'Media-Baja': '#6366f1',
    'Baja':       '#22c55e',
    'Mínima':     '#94a3b8',
  };

  constructor(
    private apiService: ApiService,
    public permissionsService: PermissionsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.loadGroups();
  }

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (res: any) => {
        this.groups = res.data ?? [];
        this.groupOptions = this.groups.map(g => ({ label: g.nombre, value: g.id }));
        if (this.groups.length > 0) {
          this.selectedGroup = this.groups[0].id;
          this.loadTickets(this.selectedGroup);
        }
        this.cdr.detectChanges();
      },
    });
  }

  onGroupChange(groupId: number) {
    this.selectedGroup = groupId;
    this.loadTickets(groupId);
  }

  loadTickets(groupId: number) {
    this.loading = true;
    this.apiService.getTicketsByGroup(groupId).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.tickets = res.data ?? [];
        this.computeStats();
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; },
    });
  }

  computeStats() {
    this.totalTickets = this.tickets.length;

    const statuses   = ['Pendiente','En progreso','Revisión','Hecho','Bloqueado'];
    const priorities = ['Crítica','Alta','Media-Alta','Media','Media-Baja','Baja','Mínima'];

    this.byStatus = statuses.map(s => {
      const count = this.tickets.filter(t => t.status === s).length;
      return { label: s, count, color: this.statusColors[s], pct: this.totalTickets ? Math.round(count / this.totalTickets * 100) : 0 };
    }).filter(s => s.count > 0);

    this.byPriority = priorities.map(p => {
      const count = this.tickets.filter(t => t.priority === p).length;
      return { label: p, count, color: this.priorityColors[p], pct: this.totalTickets ? Math.round(count / this.totalTickets * 100) : 0 };
    }).filter(p => p.count > 0);

    this.recentTickets = [...this.tickets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  getStatusSeverity(s: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    const map: Record<string, any> = {
      'Pendiente': 'secondary', 'En progreso': 'info',
      'Revisión': 'warn', 'Hecho': 'success', 'Bloqueado': 'danger',
    };
    return map[s] ?? 'secondary';
  }

  getPrioritySeverity(p: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    if (p === 'Crítica' || p === 'Alta') return 'danger';
    if (p === 'Media-Alta') return 'warn';
    if (p === 'Media') return 'info';
    return 'secondary';
  }

  get selectedGroupName(): string {
    return this.groups.find(g => g.id === this.selectedGroup)?.nombre ?? '';
  }

  getDonutOffset(index: number, type: 'status' | 'priority'): number {
    const list = type === 'status' ? this.byStatus : this.byPriority;
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += list[i].pct * 2.827;
    }
    return 282.7 - offset;
  }
}
