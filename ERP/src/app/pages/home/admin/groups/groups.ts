import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';
import { ApiService } from '../../../../core/api.service';
import { Ticket, STATUSES, PRIORITIES, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

export interface GroupMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Group {
  id: number;
  nombre: string;
  nivel: string;
  autor: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
  members: GroupMember[];
}

type View     = 'list' | 'dashboard';
type DashView = 'kanban' | 'table' | 'config';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, CardModule, TagModule,
    DialogModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, ToastModule,
    ConfirmDialogModule, TooltipModule, HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './groups.html',
  styleUrls: ['./groups.css'],
})
export class GroupsComponent implements OnInit {

  view: View         = 'list';
  dashView: DashView = 'kanban';
  selectedGroup: Group | null = null;
  groups: Group[] = [];
  loading = false;

  showDialog = false;
  isEditing  = false;
  current: Group = this.emptyForm();
  niveles = ['Alto', 'Medio', 'Bajo'];

  editingConfig = false;
  configDraft   = { nombre: '', descripcion: '', nivel: '' };
  addEmailInput = '';
  addNameInput  = '';
  addRoleInput  = 'Visor';
  memberRoles   = ['Admin', 'Editor', 'Visor'];

  groupTickets: Ticket[] = [];
  statuses    = STATUSES;
  priorities  = PRIORITIES;
  showCreateTicket = false;
  dragging: Ticket | null = null;

  // ── newTicket con assignedTo como número ──────────
  newTicket: {
    title: string;
    description: string;
    assignedTo: number | null;
    priority: TicketPriority;
    status: TicketStatus;
  } = this.emptyTicket();

  tableFilter: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  tableSearch = '';

  stats: { status: TicketStatus; color: string; count: number }[] = [
    { status: 'Pendiente',   color: '#94a3b8', count: 0 },
    { status: 'En progreso', color: '#3b82f6', count: 0 },
    { status: 'Revisión',    color: '#f59e0b', count: 0 },
    { status: 'Hecho',       color: '#22c55e', count: 0 },
    { status: 'Bloqueado',   color: '#ef4444', count: 0 },
  ];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public permissionsService: PermissionsService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.loadGroups();
  }

  // ── Grupos ────────────────────────────────────────
  loadGroups() {
    this.loading = true;
    this.apiService.getGroups().subscribe({
      next: (res: any) => {
        this.loading = false;
        const data = res.data ?? [];
        this.groups = data.map((g: any) => ({
          id:          g.id,
          nombre:      g.nombre,
          nivel:       g.nivel,
          autor:       g.autor ?? '',
          descripcion: g.descripcion ?? '',
          integrantes: 0,
          tickets:     0,
          members:     [],
        }));
        this.cdr.detectChanges();

        this.groups.forEach((g, i) => {
          this.apiService.getGroupMembers(g.id).subscribe({
            next: (r: any) => {
              const members = (r.data ?? []).map((m: any) => ({
                id:    m.users?.id    ?? 0,
                name:  m.users?.name  ?? '',
                email: m.users?.email ?? '',
                role:  m.role,
              }));
              this.groups[i] = { ...this.groups[i], members, integrantes: members.length };
              this.groups = [...this.groups];
              this.cdr.detectChanges();
            },
          });

          this.apiService.getTicketsByGroup(g.id).subscribe({
            next: (r: any) => {
              this.groups[i] = { ...this.groups[i], tickets: (r.data ?? []).length };
              this.groups = [...this.groups];
              this.cdr.detectChanges();
            },
          });
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los grupos.' });
      },
    });
  }

  // ── Navegación ────────────────────────────────────
  enterGroup(g: Group) {
    this.selectedGroup = g;
    this.groupTickets  = [];
    this.dashView      = 'kanban';
    this.editingConfig = false;
    this.view          = 'dashboard';
    this.loadGroupTickets(g.id);
  }

  loadGroupTickets(groupId: number) {
    this.apiService.getTicketsByGroup(groupId).subscribe({
      next: (res: any) => {
        const raw = res.data ?? [];
        this.groupTickets = raw.map((t: any) => ({
          id:          t.id,
          title:       t.title,
          description: t.description ?? '',
          status:      (t.status ?? 'Pendiente') as TicketStatus,
          priority:    (t.priority ?? 'Media')   as TicketPriority,
          assignedTo:  t.assigned_to
                         ? (typeof t.assigned_to === 'object' ? t.assigned_to.name : String(t.assigned_to))
                         : '',
          createdBy:   t.created_by
                         ? (typeof t.created_by === 'object' ? t.created_by.name : String(t.created_by))
                         : '',
          createdAt:   new Date(t.created_at),
          dueDate:     t.due_date ? new Date(t.due_date) : null,
          groupId:     t.group_id ?? groupId,
          comments:    [],
          history:     [],
        }));
        this.updateStats();
        this.cdr.detectChanges();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tickets.' }),
    });
  }

  backToList() {
    this.view          = 'list';
    this.selectedGroup = null;
    this.groupTickets  = [];
    this.loadGroups();
  }

  // ── CRUD grupos ───────────────────────────────────
  emptyForm(): Group {
    return { id: 0, nombre: '', nivel: '', autor: '', integrantes: 0, tickets: 0, descripcion: '', members: [] };
  }

  openCreate() { this.current = this.emptyForm(); this.isEditing = false; this.showDialog = true; }

  openEdit(g: Group, event: Event) {
    event.stopPropagation();
    this.current   = { ...g, members: [...g.members] };
    this.isEditing = true;
    this.showDialog = true;
  }

  save() {
    if (!this.current.nombre.trim() || !this.current.nivel || !this.current.autor.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Completa nombre, nivel y autor.' });
      return;
    }
    if (this.isEditing) {
      this.apiService.updateGroup(this.current.id, {
        nombre: this.current.nombre, nivel: this.current.nivel, descripcion: this.current.descripcion,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado ✓', detail: `Grupo "${this.current.nombre}" actualizado.` });
          this.loadGroups(); this.showDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
      });
    } else {
      this.apiService.createGroup({
        nombre: this.current.nombre, nivel: this.current.nivel,
        descripcion: this.current.descripcion, autor: this.current.autor,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado ✓', detail: `Grupo "${this.current.nombre}" creado.` });
          this.loadGroups(); this.showDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear.' }),
      });
    }
  }

  deleteGroup(g: Group) {
    this.confirmationService.confirm({
      message: `¿Eliminar el grupo "<b>${g.nombre}</b>"?`,
      header: 'Confirmar eliminación', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiService.deleteGroup(g.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `Grupo "${g.nombre}" eliminado.` });
            if (this.selectedGroup?.id === g.id) this.backToList();
            this.loadGroups();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
        });
      },
    });
  }

  get totalIntegrantes() { return this.groups.reduce((a, g) => a + g.integrantes, 0); }
  get totalTickets()     { return this.groups.reduce((a, g) => a + g.tickets, 0); }

  // ── Config ────────────────────────────────────────
  startEditConfig() {
    this.configDraft = {
      nombre:      this.selectedGroup!.nombre,
      descripcion: this.selectedGroup!.descripcion,
      nivel:       this.selectedGroup!.nivel,
    };
    this.editingConfig = true;
  }

  saveConfig() {
    if (!this.configDraft.nombre.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: '' });
      return;
    }
    this.apiService.updateGroup(this.selectedGroup!.id, this.configDraft).subscribe({
      next: () => {
        const g = this.groups.find(x => x.id === this.selectedGroup!.id)!;
        g.nombre = this.configDraft.nombre; g.descripcion = this.configDraft.descripcion; g.nivel = this.configDraft.nivel;
        this.selectedGroup = { ...g };
        this.editingConfig = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado ✓', detail: 'Configuración guardada.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' }),
    });
  }

  cancelConfig() { this.editingConfig = false; }

  // ── Miembros ──────────────────────────────────────
  addMember() {
    if (!this.addEmailInput.trim() || !this.addNameInput.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre y email son obligatorios.' });
      return;
    }
    this.apiService.getUsers().subscribe({
      next: (res: any) => {
        const found = (res.data ?? []).find((u: any) => u.email === this.addEmailInput.trim());
        if (!found) {
          this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'No existe un usuario con ese email.' });
          return;
        }
        this.apiService.addGroupMember(this.selectedGroup!.id, { user_id: found.id, role: this.addRoleInput }).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Añadido ✓', detail: `"${found.name}" añadido.` });
            this.addEmailInput = ''; this.addNameInput = ''; this.addRoleInput = 'Visor';
            this.reloadMembers();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo añadir.' }),
        });
      },
    });
  }

  reloadMembers() {
    if (!this.selectedGroup) return;
    this.apiService.getGroupMembers(this.selectedGroup.id).subscribe({
      next: (r: any) => {
        const members = (r.data ?? []).map((m: any) => ({
          id:    m.users?.id    ?? 0,
          name:  m.users?.name  ?? '',
          email: m.users?.email ?? '',
          role:  m.role,
        }));
        const g = this.groups.find(x => x.id === this.selectedGroup!.id)!;
        g.members = members; g.integrantes = members.length;
        this.selectedGroup = { ...g };
        this.cdr.detectChanges();
      },
    });
  }

  confirmRemoveMember(m: GroupMember) {
    this.confirmationService.confirm({
      message: `¿Eliminar a <b>${m.name}</b> del grupo?`,
      header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiService.removeGroupMember(this.selectedGroup!.id, m.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `"${m.name}" removido.` });
            this.reloadMembers();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
        });
      },
    });
  }

  // ── Tickets ───────────────────────────────────────

  // Opciones del select usando los miembros ya cargados en selectedGroup
  get memberOptions(): { label: string; value: number }[] {
    return (this.selectedGroup?.members ?? [])
      .filter(m => m.id > 0)
      .map(m => ({ label: m.name, value: m.id }));
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

  updateStats() {
    this.stats.forEach(s => s.count = this.groupTickets.filter(t => t.status === s.status).length);
  }

  byStatus(status: TicketStatus) {
    return this.groupTickets.filter(t => t.status === status);
  }

  get filteredTable(): Ticket[] {
    let list = [...this.groupTickets];
    if (this.tableFilter === 'mine')       list = list.filter(t => t.assignedTo === this.permissionsService.getUser());
    if (this.tableFilter === 'unassigned') list = list.filter(t => !t.assignedTo);
    if (this.tableFilter === 'high')       list = list.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');
    if (this.tableSearch) list = list.filter(t => t.title.toLowerCase().includes(this.tableSearch.toLowerCase()));
    return list;
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
      this.messageService.add({ severity: 'warn', summary: 'Asignación requerida', detail: 'Selecciona un miembro del grupo.' });
      return;
    }
    const userId = Number(localStorage.getItem('userId') ?? 0);
    this.apiService.createTicket({
      title:       this.newTicket.title.trim(),
      description: this.newTicket.description,
      status:      this.newTicket.status,
      priority:    this.newTicket.priority,
      group_id:    this.selectedGroup!.id,
      created_by:  userId,
      assigned_to: this.newTicket.assignedTo,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Creado ✓', detail: `"${this.newTicket.title}" creado.` });
        this.showCreateTicket = false;
        this.newTicket = this.emptyTicket();
        this.loadGroupTickets(this.selectedGroup!.id);
      },
      error: (err) => {
        const detail = err.error?.data?.[0]?.error ?? err.error?.message ?? 'No se pudo crear el ticket.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  onDragStart(ticket: Ticket) { this.dragging = ticket; }
  onDragOver(e: DragEvent)    { e.preventDefault(); }

  onDrop(e: DragEvent, status: TicketStatus) {
    e.preventDefault();
    if (!this.dragging) return;
    if (!this.permissionsService.has('ticket:edit_state')) {
      this.messageService.add({ severity: 'warn', summary: 'Sin permiso', detail: 'No puedes cambiar el estado.' });
      return;
    }
    const userId  = Number(localStorage.getItem('userId') ?? 0);
    const dragged = this.dragging;
    this.dragging = null;
    this.apiService.updateTicketStatus(dragged.id, {
      from_status: dragged.status, to_status: status, user_id: userId,
    }).subscribe({
      next: () => {
        const t = this.groupTickets.find(x => x.id === dragged.id);
        if (t) { t.status = status; this.updateStats(); }
        this.groupTickets = [...this.groupTickets];
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `→ ${status}` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.' }),
    });
  }

  // ── Severities ────────────────────────────────────
  getNivelSeverity(nivel: string): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    if (nivel === 'Alto')  return 'danger';
    if (nivel === 'Medio') return 'warn';
    return 'success';
  }

  getPrioritySeverity(p: TicketPriority): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    if (p === 'Crítica' || p === 'Alta') return 'danger';
    if (p === 'Media-Alta')              return 'warn';
    if (p === 'Media')                   return 'info';
    return 'secondary';
  }

  getStatusSeverity(s: TicketStatus): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    const map: Record<TicketStatus, 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger'> = {
      'Pendiente': 'secondary', 'En progreso': 'info',
      'Revisión': 'warn', 'Hecho': 'success', 'Bloqueado': 'danger',
    };
    return map[s];
  }

  getStatusColor(s: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      'Pendiente': '#94a3b8', 'En progreso': '#3b82f6',
      'Revisión': '#f59e0b', 'Hecho': '#22c55e', 'Bloqueado': '#ef4444',
    };
    return map[s];
  }
}
