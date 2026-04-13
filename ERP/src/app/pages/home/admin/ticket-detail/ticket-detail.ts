import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { PermissionsService } from '../../../../core/permissions';
import { ApiService } from '../../../../core/api.service';
import { STATUSES, PRIORITIES, PRIORITY_LABELS, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, TagModule, SelectModule,
    InputTextModule, TextareaModule, ToastModule, DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './ticket-detail.html',
  styleUrls: ['./ticket-detail.css'],
})
export class TicketDetailComponent implements OnInit {
  ticket: any    = null;
  statuses       = STATUSES;
  priorities     = PRIORITIES;
  priorityLabels = PRIORITY_LABELS;
  editing        = false;
  today          = new Date();
  draft: any     = {};
  newComment     = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    public permissionsService: PermissionsService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id && id > 0) {
        this.ticket     = null;
        this.editing    = false;
        this.newComment = '';
        this.loadTicket(id);
        // Sin cdr.detectChanges() aquí
      }
    });
  }
}

loadTicket(id: number) {
  this.apiService.getTicket(id).subscribe({
    next: (res: any) => {
      const raw = res?.data ?? res;

      if (!raw || !raw.id) {
        this.ticket = null;
        this.cdr.detectChanges(); // Solo aquí, dentro del subscribe de HTTP
        return;
      }

      this.ticket = {
        ...raw,
        createdBy:  raw.created_by?.name  ?? String(raw.created_by  ?? ''),
        assignedTo: raw.assigned_to?.name ?? String(raw.assigned_to ?? ''),
        createdAt:  new Date(raw.created_at),
        dueDate:    raw.due_date ? new Date(raw.due_date) : null,
        comments:   (raw.ticket_comments ?? []).map((c: any) => ({
          id:     c.id,
          author: c.users?.name ?? String(c.author_id ?? 'Anónimo'),
          text:   c.text,
          date:   new Date(c.created_at),
        })),
        history: (raw.ticket_history ?? []).map((h: any) => ({
          id:    h.id,
          field: h.field,
          from:  h.from_value,
          to:    h.to_value,
          by:    h.users?.name ?? String(h.changed_by ?? ''),
          date:  new Date(h.changed_at),
        })),
      };

      this.cdr.detectChanges(); // Solo aquí, después de asignar ticket
    },
    error: (err) => {
      console.error('Error:', err);
      this.ticket = null;
      this.cdr.detectChanges();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el ticket.' });
    },
  });
}

  goBack() { this.router.navigate(['/home/groups']); }

  get currentUser()     { return this.permissionsService.getUser(); }
  get isCreator()       { return this.ticket?.createdBy === this.currentUser; }
  get isAssigned()      { return this.ticket?.assignedTo === this.currentUser; }
  get canEdit()         { return this.isCreator; }
  get canChangeStatus() { return (this.isCreator || this.isAssigned) && this.permissionsService.has('ticket:edit_state'); }

  startEdit() { this.draft = { ...this.ticket }; this.editing = true; }

  saveEdit() {
    if (!this.ticket) return;
    this.apiService.updateTicket(this.ticket.id, {
      title:       this.draft.title,
      description: this.draft.description,
      priority:    this.draft.priority,
      assigned_to: this.draft.assignedTo,
      due_date:    this.draft.dueDate,
    }).subscribe({
      next: () => {
        Object.assign(this.ticket, this.draft);
        this.editing = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Guardado ✓', detail: 'Ticket actualizado.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
    });
  }

  changeStatus(status: TicketStatus) {
    if (!this.ticket) return;
    const userId = Number(localStorage.getItem('userId') ?? 0);
    this.apiService.updateTicketStatus(this.ticket.id, {
      from_status: this.ticket.status,
      to_status:   status,
      user_id:     userId,
    }).subscribe({
      next: () => {
        this.ticket.history.push({
          id: Date.now(), field: 'status',
          from: this.ticket.status, to: status,
          by: this.currentUser, date: new Date(),
        });
        this.ticket.status = status;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `→ ${status}` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.' }),
    });
  }

  addComment() {
    if (!this.newComment.trim() || !this.ticket) return;
    const userId = Number(localStorage.getItem('userId') ?? 0);
    this.apiService.addTicketComment(this.ticket.id, { user_id: userId, text: this.newComment }).subscribe({
      next: () => {
        this.ticket.comments.push({
          id: Date.now(), author: this.currentUser,
          text: this.newComment, date: new Date(),
        });
        this.newComment = '';
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Comentario agregado', detail: '' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el comentario.' }),
    });
  }

  getPriorityLabel(p: any): string {
    return this.priorityLabels[p as TicketPriority] ?? p;
  }

  getPrioritySeverity(p: any): 'danger' | 'warn' | 'info' | 'secondary' {
    if (p === 'Crítica' || p === 'Alta') return 'danger';
    if (p === 'Media-Alta') return 'warn';
    if (p === 'Media')      return 'info';
    return 'secondary';
  }

  getStatusSeverity(s: TicketStatus): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    const map: Record<TicketStatus, 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger'> = {
      'Pendiente': 'secondary', 'En progreso': 'info',
      'Revisión': 'warn', 'Hecho': 'success', 'Bloqueado': 'danger',
    };
    return map[s];
  }
}
