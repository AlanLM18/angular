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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';
import { ApiService } from '../../../../core/api.service';
import { STATUSES, PRIORITIES, PRIORITY_LABELS, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, TagModule, SelectModule,
    InputTextModule, TextareaModule, ToastModule,
    DividerModule, ConfirmDialogModule, TooltipModule,
    HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
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
  groupId        = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public permissionsService: PermissionsService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.groupId = Number(this.route.snapshot.queryParamMap.get('groupId') ?? 0);
      this.route.paramMap.subscribe(params => {
        const id = Number(params.get('id'));
        if (id && id > 0) {
          this.ticket     = null;
          this.editing    = false;
          this.newComment = '';
          this.loadTicket(id);
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
          this.cdr.detectChanges();
          return;
        }
        this.groupId = raw.group_id ?? this.groupId;
        this.ticket = {
          ...raw,
          createdBy:  raw.created_by?.name  ?? String(raw.created_by  ?? ''),
          assignedTo: raw.assigned_to?.name ?? String(raw.assigned_to ?? ''),
          assignedToId: raw.assigned_to?.id ?? null,
          createdById:  raw.created_by?.id  ?? null,
          createdAt:  new Date(raw.created_at),
          dueDate:    raw.due_date ? new Date(raw.due_date) : null,
          comments: (raw.ticket_comments ?? []).map((c: any) => ({
            id:     c.id,
            author: c.users?.name ?? 'Anónimo',
            text:   c.text,
            date:   new Date(c.created_at),
          })),
          history: (raw.ticket_history ?? []).map((h: any) => ({
            id:    h.id,
            field: h.field,
            from:  h.from_value,
            to:    h.to_value,
            by:    h.users?.name ?? '',
            date:  new Date(h.changed_at),
          })),
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticket = null;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el ticket.' });
      },
    });
  }

  goBack() {
    if (this.groupId) {
      this.router.navigate(['/home/groups'], { queryParams: { groupId: this.groupId } });
    } else {
      this.router.navigate(['/home/groups']);
    }
  }

  get currentUserId() { return Number(localStorage.getItem('userId') ?? 0); }
  get currentUser()   { return this.permissionsService.getUser(); }

  get canEdit() {
    return this.permissionsService.has('ticket:edit') ||
           this.ticket?.createdById === this.currentUserId;
  }

  get canDelete() {
    return this.permissionsService.has('ticket:delete') ||
           this.ticket?.createdById === this.currentUserId;
  }

  get canChangeStatus() {
    return this.permissionsService.has('ticket:edit_state') ||
           this.ticket?.createdById  === this.currentUserId ||
           this.ticket?.assignedToId === this.currentUserId;
  }

  get canComment() {
    return this.permissionsService.has('ticket:view');
  }

  // ── Editar ────────────────────────────────────────
  startEdit() {
    this.draft = {
      title:       this.ticket.title,
      description: this.ticket.description,
      priority:    this.ticket.priority,
      assignedToId: this.ticket.assignedToId,
      dueDate:     this.ticket.dueDate,
    };
    this.editing = true;
  }

  cancelEdit() { this.editing = false; }

  saveEdit() {
    if (!this.ticket) return;
    if (!this.draft.title?.trim() || this.draft.title.trim().length < 3) {
      this.messageService.add({ severity: 'warn', summary: 'Título inválido', detail: 'Mínimo 3 caracteres.' });
      return;
    }
    this.apiService.updateTicket(this.ticket.id, {
      title:       this.draft.title.trim(),
      description: this.draft.description,
      priority:    this.draft.priority,
      assigned_to: this.draft.assignedToId,
      due_date:    this.draft.dueDate
                     ? new Date(this.draft.dueDate).toISOString().split('T')[0]
                     : null,
    }).subscribe({
      next: () => {
        this.ticket.title       = this.draft.title.trim();
        this.ticket.description = this.draft.description;
        this.ticket.priority    = this.draft.priority;
        this.ticket.assignedToId = this.draft.assignedToId;
        this.ticket.dueDate     = this.draft.dueDate ? new Date(this.draft.dueDate) : null;
        this.editing = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Guardado ✓', detail: 'Ticket actualizado.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
    });
  }

  // ── Eliminar ──────────────────────────────────────
  deleteTicket() {
    if (!this.ticket) return;
    this.confirmationService.confirm({
      message: `¿Eliminar el ticket "<b>${this.ticket.title}</b>"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiService.deleteTicket(this.ticket.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `Ticket "${this.ticket.title}" eliminado.` });
            setTimeout(() => this.goBack(), 1000);
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
        });
      },
    });
  }

  // ── Estado ────────────────────────────────────────
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

  // ── Comentario ────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────
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
