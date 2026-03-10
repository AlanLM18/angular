import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';
import { Ticket, MOCK_TICKETS, STATUSES, PRIORITIES, PRIORITY_LABELS, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, TagModule, InputTextModule,
    SelectModule, ToastModule, HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './ticket-list.html',
  styleUrls: ['./ticket-list.css'],
})
export class TicketListComponent {
  tickets: Ticket[] = [...MOCK_TICKETS];
  statuses = ['', ...STATUSES];
  priorities = ['', ...PRIORITIES];
  priorityLabels = PRIORITY_LABELS;

  searchText  = '';
  filterStatus: string = '';
  filterPriority: string = '';
  filterAssigned: string = '';
  activeQuick: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  sortField: keyof Ticket | '' = '';
  sortAsc = true;

  constructor(public permissionsService: PermissionsService) {}

  get currentUser() { return this.permissionsService.getUser(); }

  get filtered(): Ticket[] {
    let list = [...this.tickets];

    // Filtros rápidos
    if (this.activeQuick === 'mine')       list = list.filter(t => t.assignedTo === this.currentUser);
    if (this.activeQuick === 'unassigned') list = list.filter(t => !t.assignedTo);
    if (this.activeQuick === 'high')       list = list.filter(t => t.priority === '最高' || t.priority === '高');

    // Filtros de columna
    if (this.searchText)     list = list.filter(t => t.title.toLowerCase().includes(this.searchText.toLowerCase()));
    if (this.filterStatus)   list = list.filter(t => t.status === this.filterStatus);
    if (this.filterPriority) list = list.filter(t => t.priority === this.filterPriority);
    if (this.filterAssigned) list = list.filter(t => t.assignedTo?.toLowerCase().includes(this.filterAssigned.toLowerCase()));

    // Ordenamiento
    if (this.sortField) {
      list.sort((a, b) => {
        const va = String(a[this.sortField as keyof Ticket] ?? '');
        const vb = String(b[this.sortField as keyof Ticket] ?? '');
        return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }

  sort(field: keyof Ticket) {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
  }

  sortIcon(field: keyof Ticket) {
    if (this.sortField !== field) return 'pi pi-sort';
    return this.sortAsc ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }

  clearFilters() {
    this.searchText = ''; this.filterStatus = '';
    this.filterPriority = ''; this.filterAssigned = '';
    this.activeQuick = 'all'; this.sortField = '';
  }

  getPrioritySeverity(p: TicketPriority): "success" | "info" | "warn" | "secondary" | "contrast" | "danger" {
    if (p === '最高' || p === '高') return 'danger';
    if (p === '中高') return 'warn';
    if (p === '中')   return 'info';
    return 'secondary';
  }

  getStatusSeverity(s: TicketStatus): "success" | "info" | "warn" | "secondary" | "contrast" | "danger" {
    const map: Record<TicketStatus, "success" | "info" | "warn" | "secondary" | "contrast" | "danger"> = {
      'Pendiente': 'secondary', 'En progreso': 'info',
      'Revisión': 'warn', 'Hecho': 'success', 'Bloqueado': 'danger',
    };
    return map[s];
  }
}
