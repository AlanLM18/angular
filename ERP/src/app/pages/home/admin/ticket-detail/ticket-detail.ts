import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { PermissionsService } from '../../../../core/permissions';
import { Ticket, MOCK_TICKETS, STATUSES, PRIORITIES, PRIORITY_LABELS, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, TagModule, SelectModule,
    InputTextModule, TextareaModule, ToastModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './ticket-detail.html',
  styleUrls: ['./ticket-detail.css'],
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  statuses = STATUSES;
  priorities = PRIORITIES;
  priorityLabels = PRIORITY_LABELS;
  editing = false;
  today = new Date();
  draft: Partial<Ticket> & { priority?: TicketPriority } = {};
  newComment = '';

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    public permissionsService: PermissionsService,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ticket = MOCK_TICKETS.find(t => t.id === id) ?? null;
  }

  get currentUser() { return this.permissionsService.getUser(); }
  get isCreator()   { return this.ticket?.createdBy === this.currentUser; }
  get isAssigned()  { return this.ticket?.assignedTo === this.currentUser; }
  get canEdit()     { return this.isCreator && this.permissionsService.has('ticket:edit'); }
  get canChangeStatus() { return (this.isCreator || this.isAssigned) && this.permissionsService.has('ticket:edit_state'); }

  startEdit() {
    this.draft = { ...this.ticket! };
    this.editing = true;
  }

  saveEdit() {
    if (!this.ticket) return;
    const changes: string[] = [];
    if (this.draft.title !== this.ticket.title)           changes.push(`título`);
    if (this.draft.description !== this.ticket.description) changes.push(`descripción`);
    if (this.draft.assignedTo !== this.ticket.assignedTo) {
      this.ticket.history.push({ id: Date.now(), field: 'assignedTo', from: this.ticket.assignedTo, to: this.draft.assignedTo!, by: this.currentUser, date: new Date() });
    }
    if (this.draft.priority !== this.ticket.priority) {
      this.ticket.history.push({ id: Date.now()+1, field: 'priority', from: this.ticket.priority, to: this.draft.priority!, by: this.currentUser, date: new Date() });
    }
    Object.assign(this.ticket, this.draft);
    this.editing = false;
  this.today = new Date();
    this.messageService.add({ severity: 'success', summary: 'Agree ✓', detail: 'Ticket actualizado.' });
  }

  changeStatus(status: TicketStatus) {
    if (!this.ticket) return;
    this.ticket.history.push({ id: Date.now(), field: 'status', from: this.ticket.status, to: status, by: this.currentUser, date: new Date() });
    this.ticket.status = status;
    this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `→ ${status}` });
  }

  addComment() {
    if (!this.newComment.trim() || !this.ticket) return;
    this.ticket.comments.push({ id: Date.now(), author: this.currentUser, text: this.newComment, date: new Date() });
    this.newComment = '';
    this.messageService.add({ severity: 'success', summary: 'Comentario agregado', detail: '' });
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
