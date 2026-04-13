import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
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
import { ApiService } from '../../../../core/api.service';
import { STATUSES, PRIORITIES, PRIORITY_LABELS, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

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
export class TicketsComponent implements OnInit {
  tickets: any[]   = [];
  statuses         = STATUSES;
  priorities       = PRIORITIES;
  priorityLabels   = PRIORITY_LABELS;
  showCreate       = false;
  dragging: any    = null;
  groupId          = 0;
  activeFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  newTicket        = this.emptyTicket();
  groupMembers: { label: string; value: number | null }[] = [];

  constructor(
    private messageService: MessageService,
    public permissionsService: PermissionsService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    this.groupId = Number(this.route.snapshot.queryParamMap.get('groupId') ?? 0);
    if (isPlatformBrowser(this.platformId)) {
      this.loadTickets();
      this.loadGroupMembers();
    }
  }

  loadTickets() {
    if (!this.groupId) return;
    this.apiService.getTicketsByGroup(this.groupId).subscribe({
      next: (res: any) => {
        this.tickets = res.data ?? [];
        this.cdr.detectChanges();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tickets.' }),
    });
  }

  loadGroupMembers() {
    if (!this.groupId) return;
    this.apiService.getGroupMembers(this.groupId).subscribe({
      next: (res: any) => {
        const members = res.data ?? [];
        this.groupMembers = members.map((m: any) => ({
          label: m.users?.name ?? 'Usuario',
          value: m.users?.id   ?? null,
        }));
        this.cdr.detectChanges();
      },
    });
  }

  get currentUser() { return this.permissionsService.getUser(); }

  get filtered() {
    switch (this.activeFilter) {
      case 'mine':       return this.tickets.filter(t => t.assigned_to === this.currentUser);
      case 'unassigned': return this.tickets.filter(t => !t.assigned_to);
      case 'high':       return this.tickets.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');
      default:           return this.tickets;
    }
  }

  byStatus(status: TicketStatus) { return this.filtered.filter(t => t.status === status); }

  onDragStart(ticket: any) { this.dragging = ticket; }
  onDragOver(e: DragEvent) { e.preventDefault(); }

  onDrop(e: DragEvent, status: TicketStatus) {
    e.preventDefault();
    if (!this.dragging) return;
    if (!this.permissionsService.has('ticket:edit_state')) {
      this.messageService.add({ severity: 'warn', summary: 'Sin permiso', detail: 'No puedes cambiar el estado.' });
      return;
    }
    const userId = Number(localStorage.getItem('userId') ?? 0);
    this.apiService.updateTicketStatus(this.dragging.id, {
      from_status: this.dragging.status,
      to_status:   status,
      user_id:     userId,
    }).subscribe({
      next: () => {
        this.dragging.status = status;
        this.tickets = [...this.tickets];
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `→ ${status}` });
      },
    });
    this.dragging = null;
  }

  emptyTicket() {
    return {
      title:       '',
      description: '',
      assignedTo:  null as number | null,
      priority:    'Media' as TicketPriority,
      status:      'Pendiente' as TicketStatus,
    };
  }

  createTicket() {
    if (!this.newTicket.title.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Título requerido', detail: '' });
      return;
    }
    if (this.newTicket.title.trim().length < 3) {
      this.messageService.add({ severity: 'warn', summary: 'Título muy corto', detail: 'Mínimo 3 caracteres.' });
      return;
    }
    if (!this.newTicket.assignedTo) {
      this.messageService.add({ severity: 'warn', summary: 'Asignación requerida', detail: 'Debes asignar el ticket a un miembro del grupo.' });
      return;
    }

    const userId = Number(localStorage.getItem('userId') ?? 0);
    this.apiService.createTicket({
      title:       this.newTicket.title.trim(),
      description: this.newTicket.description,
      status:      this.newTicket.status,
      priority:    this.newTicket.priority,
      group_id:    this.groupId,
      created_by:  userId,
      assigned_to: this.newTicket.assignedTo,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Creado ✓', detail: `"${this.newTicket.title}" creado.` });
        this.showCreate = false;
        this.newTicket = this.emptyTicket();
        this.loadTickets();
      },
      error: (err) => {
        const detail = err.error?.message ?? 'No se pudo crear el ticket.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  getPrioritySeverity(p: TicketPriority): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    if (p === 'Crítica' || p === 'Alta') return 'danger';
    if (p === 'Media-Alta') return 'warn';
    if (p === 'Media')      return 'info';
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
