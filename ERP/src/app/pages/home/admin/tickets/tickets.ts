import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';
import { Ticket, TicketStatus, MOCK_TICKETS, STATUSES, PRIORITIES, PRIORITY_LABELS, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, TagModule, DialogModule,
    InputTextModule, TextareaModule, SelectModule,
    ToastModule, TooltipModule, HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './tickets.html',
  styleUrls: ['./tickets.css'],
})
export class TicketsComponent {
  tickets: Ticket[] = [...MOCK_TICKETS];
  statuses = STATUSES;
  priorities = PRIORITIES;
  priorityLabels = PRIORITY_LABELS;
  showCreate = false;
  dragging: Ticket | null = null;

  // Filtros rápidos
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';

  newTicket = this.emptyTicket();

  constructor(
    private messageService: MessageService,
    public permissionsService: PermissionsService,
  ) {}

  emptyTicket() {
    return { title: '', description: '', assignedTo: '', priority: '中' as TicketPriority, status: 'Pendiente' as TicketStatus };
  }

  get currentUser() { return this.permissionsService.getUser(); }

  get filtered() {
    switch (this.activeFilter) {
      case 'mine':       return this.tickets.filter(t => t.assignedTo === this.currentUser);
      case 'unassigned': return this.tickets.filter(t => !t.assignedTo);
      case 'high':       return this.tickets.filter(t => t.priority === '最高' || t.priority === '高');
      default:           return this.tickets;
    }
  }

  byStatus(status: TicketStatus) {
    return this.filtered.filter(t => t.status === status);
  }

  // Drag & Drop
  onDragStart(ticket: Ticket) { this.dragging = ticket; }
  onDragOver(e: DragEvent)    { e.preventDefault(); }

  onDrop(e: DragEvent, status: TicketStatus) {
    e.preventDefault();
    if (!this.dragging) return;
    if (!this.permissionsService.has('ticket:edit_state')) {
      this.messageService.add({ severity: 'warn', summary: 'Sin permiso', detail: 'No puedes cambiar el estado.' });
      return;
    }
    const t = this.tickets.find(x => x.id === this.dragging!.id);
    if (t) {
      t.history.push({ id: Date.now(), field: 'status', from: t.status, to: status, by: this.currentUser, date: new Date() });
      t.status = status;
      this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `"${t.title}" → ${status}` });
    }
    this.dragging = null;
  }

  createTicket() {
    if (!this.newTicket.title.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Título requerido', detail: 'El título no puede estar vacío.' });
      return;
    }
    const t: Ticket = {
      id: this.tickets.length + 1,
      ...this.newTicket,
      createdBy: this.currentUser,
      createdAt: new Date(),
      dueDate: null,
      comments: [],
      history: [],
      groupId: 1,
    };
    this.tickets.push(t);
    this.messageService.add({ severity: 'success', summary: 'Ticket creado', detail: `"${t.title}" agregado.` });
    this.showCreate = false;
    this.newTicket = this.emptyTicket();
  }

  getPrioritySeverity(p: TicketPriority): "success" | "info" | "warn" | "secondary" | "contrast" | "danger" {
    if (p === '最高') return 'danger';
    if (p === '高')   return 'danger';
    if (p === '中高') return 'warn';
    if (p === '中')   return 'info';
    return 'secondary';
  }

  getStatusColor(s: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      'Pendiente': '#94a3b8', 'En progreso': '#3b82f6',
      'Revisión': '#f59e0b', 'Hecho': '#22c55e', 'Bloqueado': '#ef4444',
    };
    return map[s];
  }
}
