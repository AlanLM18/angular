import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';
import { ApiService } from '../../../../core/api.service';

const PERMISSION_GROUPS = [
  { label: 'Grupos',   icon: 'pi pi-sitemap', perms: ['group:view', 'group:edit', 'group:add', 'group:delete'] },
  { label: 'Tickets',  icon: 'pi pi-ticket',  perms: ['ticket:view', 'ticket:edit', 'ticket:add', 'ticket:delete', 'ticket:edit_state'] },
  { label: 'Usuarios', icon: 'pi pi-users',   perms: ['user:view', 'users:view', 'user:edit', 'user:add', 'user:delete'] },
  { label: 'Sistema',  icon: 'pi pi-shield',  perms: ['superadmin'] },
];

const TICKET_PERMS = [
  'ticket:view', 'ticket:edit', 'ticket:add', 'ticket:delete', 'ticket:edit_state'
];

export interface UserWithPerms {
  id:       number;
  username: string;
  name:     string;
  email:    string;
  role:     string;
  group_id: number;
  status:   'active' | 'inactive';
  perms:    string[];
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, TagModule, ButtonModule, InputTextModule,
    DialogModule, SelectModule, ToastModule, ConfirmDialogModule,
    TooltipModule, HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class UsersComponent implements OnInit {
  search     = '';
  showDialog = false;
  isEditing  = false;
  loading    = false;
  current: UserWithPerms = this.emptyUser();

  selectedUser: UserWithPerms | null = null;
  permSearch   = '';
  permGroups   = PERMISSION_GROUPS;

  // ── Grupos y permisos por grupo ───────────────────
  userGroups:      any[]          = [];
  selectedGroupId: number | null  = null;
  groupPerms:      { code: string; description: string }[] = [];
  loadingGroups    = false;
  loadingPerms     = false;

  users: UserWithPerms[] = [];

  roles = [
    { label: 'Super Admin', value: 'Super Admin' },
    { label: 'Admin',       value: 'Admin'       },
    { label: 'Usuario',     value: 'Usuario'     },
  ];
  groups = [
    { label: 'Administración', value: 1 },
    { label: 'Ventas',         value: 2 },
    { label: 'Soporte',        value: 3 },
    { label: 'Finanzas',       value: 4 },
  ];
  statuses = [
    { label: 'Activo',   value: 'active'   },
    { label: 'Inactivo', value: 'inactive' },
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
    if (isPlatformBrowser(this.platformId)) this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.apiService.getUsers().subscribe({
      next: (res: any) => {
        this.loading = false;
        const usersData = res.data ?? [];
        this.users = usersData.map((u: any) => ({ ...u, perms: [] }));
        this.cdr.detectChanges();

        let loaded = 0;
        usersData.forEach((u: any, i: number) => {
          this.apiService.getUser(u.id).subscribe({
            next: (r: any) => {
              this.users[i] = { ...this.users[i], perms: r.data?.perms ?? [] };
              loaded++;
              if (loaded === usersData.length) {
                this.users = [...this.users];
                this.cdr.detectChanges();
              }
            },
          });
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios.' });
      },
    });
  }

  get filtered() {
    return this.users.filter(u =>
      u.name?.toLowerCase().includes(this.search.toLowerCase())     ||
      u.email?.toLowerCase().includes(this.search.toLowerCase())    ||
      u.username?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  get activeCount()   { return this.users.filter(u => u.status === 'active').length; }
  get inactiveCount() { return this.users.filter(u => u.status === 'inactive').length; }

  // ── Panel de permisos ─────────────────────────────
  openPerms(u: UserWithPerms) {
    this.selectedUser    = u;
    this.permSearch      = '';
    this.userGroups      = [];
    this.selectedGroupId = null;
    this.groupPerms      = [];
    this.loadUserGroups(u.id);
  }

  closePerms() {
    this.selectedUser    = null;
    this.userGroups      = [];
    this.selectedGroupId = null;
    this.groupPerms      = [];
  }

  loadUserGroups(userId: number) {
    this.loadingGroups = true;
    this.apiService.getUserGroups(userId).subscribe({
      next: (res: any) => {
        this.loadingGroups = false;
        // FIX: el backend devuelve { id, nombre, my_role, ... } en cada item
        this.userGroups = res.data ?? [];
        if (this.userGroups.length > 0) {
          // FIX: asegurar que selectedGroupId sea number, no string
          this.selectedGroupId = Number(this.userGroups[0].id);
          this.loadGroupPerms(userId, this.selectedGroupId);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingGroups = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los grupos.' });
      },
    });
  }

  onGroupSelect(groupId: number) {
    // FIX: forzar conversión a number para evitar comparaciones string vs number
    this.selectedGroupId = Number(groupId);
    this.groupPerms      = [];
    this.loadGroupPerms(this.selectedUser!.id, this.selectedGroupId);
  }

  loadGroupPerms(userId: number, groupId: number) {
    this.loadingPerms = true;
    // FIX: asegurar que ambos parámetros son number
    this.apiService.getGroupPermissions(Number(groupId), Number(userId)).subscribe({
      next: (res: any) => {
        this.loadingPerms = false;
        this.groupPerms   = res.data?.perms ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPerms = false;
        this.groupPerms   = [];
        this.cdr.detectChanges();
      },
    });
  }

  isTicketPerm(code: string): boolean {
    return TICKET_PERMS.includes(code);
  }

  filteredPermGroups() {
    if (!this.permSearch.trim()) return this.permGroups;
    const q = this.permSearch.toLowerCase();
    return this.permGroups
      .map(g => ({ ...g, perms: g.perms.filter((p: string) => p.toLowerCase().includes(q)) }))
      .filter(g => g.perms.length > 0);
  }

  hasGroupPerm(code: string): boolean {
    return this.groupPerms.some(p => p.code === code);
  }

  getPermDescription(code: string): string {
    const found = this.groupPerms.find(p => p.code === code);
    const allPerms: Record<string, string> = {
      'group:view':        'Ver grupos',
      'group:edit':        'Editar grupos',
      'group:add':         'Crear grupos',
      'group:delete':      'Eliminar grupos',
      'ticket:view':       'Ver tickets',
      'ticket:edit':       'Editar tickets',
      'ticket:add':        'Crear tickets',
      'ticket:delete':     'Eliminar tickets',
      'ticket:edit_state': 'Cambiar estado de tickets',
      'user:view':         'Ver usuario',
      'users:view':        'Ver lista de usuarios',
      'user:edit':         'Editar usuarios',
      'user:add':          'Crear usuarios',
      'user:delete':       'Eliminar usuarios',
      'superadmin':        'Super administrador',
    };
    return found?.description ?? allPerms[code] ?? code;
  }

  toggleGroupPerm(code: string) {
    if (!this.selectedUser || !this.selectedGroupId) return;
    if (!this.isTicketPerm(code)) return;

    const has = this.hasGroupPerm(code);

    // Actualizar localmente primero (optimistic update)
    if (has) {
      this.groupPerms = this.groupPerms.filter(p => p.code !== code);
    } else {
      this.groupPerms = [...this.groupPerms, { code, description: this.getPermDescription(code) }];
    }

    // FIX: enviar TODOS los permisos activos del grupo, no solo los tickets
    // El backend hace DELETE + INSERT, si solo mandas tickets pierdes los demás permisos
    const allPermCodes = this.groupPerms.map(p => p.code);

    this.apiService.updateGroupPermissions(this.selectedGroupId, {
      user_id:    this.selectedUser.id,
      perm_codes: allPermCodes,
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary:  'Permiso actualizado',
          detail:   `${this.getPermDescription(code)} ${has ? 'removido' : 'agregado'}.`,
        });
      },
      error: () => {
        // Revertir cambio local si falla el API
        if (has) {
          this.groupPerms = [...this.groupPerms, { code, description: this.getPermDescription(code) }];
        } else {
          this.groupPerms = this.groupPerms.filter(p => p.code !== code);
        }
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el permiso.' });
      },
    });
  }

  // ── CRUD ──────────────────────────────────────────
  emptyUser(): UserWithPerms {
    return { id: 0, username: '', name: '', email: '', role: 'Usuario', group_id: 1, status: 'active', perms: [] };
  }

  openCreate() { this.current = this.emptyUser(); this.isEditing = false; this.showDialog = true; }
  openEdit(u: UserWithPerms) { this.current = { ...u, perms: [...u.perms] }; this.isEditing = true; this.showDialog = true; }

  save() {
    if (!this.current.name.trim() || !this.current.email.trim() || !this.current.username?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre, usuario y email son obligatorios.' });
      return;
    }

    if (this.isEditing) {
      this.apiService.updateUser(this.current.id, {
        name:     this.current.name,
        email:    this.current.email,
        role:     this.current.role,
        group_id: this.current.group_id,
        status:   this.current.status,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado ✓', detail: `"${this.current.name}" actualizado.` });
          this.loadUsers(); this.showDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
      });
    } else {
      this.apiService.addUser({
        username:   this.current.username,
        password:   'Temporal@123',
        name:       this.current.name,
        email:      this.current.email,
        role:       this.current.role,
        group_id:   this.current.group_id,
        status:     this.current.status,
        perm_codes: this.current.perms,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado ✓', detail: `"${this.current.name}" creado.` });
          this.loadUsers(); this.showDialog = false;
        },
        error: (err) => {
          const msg = err.error?.data?.[0]?.error ?? 'No se pudo crear el usuario.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
    }
  }

  confirmDelete(u: UserWithPerms) {
    this.confirmationService.confirm({
      message: `¿Eliminar a <b>${u.name}</b>?`,
      header: 'Confirmar eliminación', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiService.deleteUser(u.id).subscribe({
          next: () => {
            if (this.selectedUser?.id === u.id) this.selectedUser = null;
            this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `"${u.name}" eliminado.` });
            this.loadUsers();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
        });
      },
    });
  }
}
