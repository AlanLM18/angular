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

export interface UserWithPerms {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  group_id: number;
  status: 'active' | 'inactive';
  perms: string[];
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
  permSearch = '';
  permGroups = PERMISSION_GROUPS;

  users: UserWithPerms[] = [];

  roles  = [
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
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.loading = true;
    this.apiService.getUsers().subscribe({
      next: (res: any) => {
        this.loading = false;
        const usersData = res.data ?? [];
        // Inicializar con perms vacíos
        this.users = usersData.map((u: any) => ({ ...u, perms: [] }));
        this.cdr.detectChanges();

        // Cargar permisos de cada usuario y reasignar el arreglo completo
        let loaded = 0;
        usersData.forEach((u: any, i: number) => {
          this.apiService.getUser(u.id).subscribe({
            next: (r: any) => {
              this.users[i] = { ...this.users[i], perms: r.data?.perms ?? [] };
              loaded++;
              // Reasignar cuando todos cargaron para que Angular detecte el cambio
              if (loaded === usersData.length) {
                this.users = [...this.users];
                this.cdr.detectChanges();
              }
            },
          });
        });
      },
      error: (err) => {
        this.loading = false;
        console.log('Error getUsers:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios.' });
      },
    });
  }

  get filtered() {
    return this.users.filter(u =>
      u.name?.toLowerCase().includes(this.search.toLowerCase()) ||
      u.email?.toLowerCase().includes(this.search.toLowerCase()) ||
      u.username?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  get activeCount()   { return this.users.filter(u => u.status === 'active').length; }
  get inactiveCount() { return this.users.filter(u => u.status === 'inactive').length; }

  // ── Panel de permisos ─────────────────────────────
  openPerms(u: UserWithPerms) { this.selectedUser = u; this.permSearch = ''; }
  closePerms() { this.selectedUser = null; }

  filteredGroups() {
    if (!this.permSearch.trim()) return this.permGroups;
    const q = this.permSearch.toLowerCase();
    return this.permGroups
      .map(g => ({ ...g, perms: g.perms.filter(p => p.toLowerCase().includes(q)) }))
      .filter(g => g.perms.length > 0);
  }

  hasPerm(u: UserWithPerms, p: string): boolean { return u.perms?.includes(p) ?? false; }

  togglePerm(u: UserWithPerms, p: string) {
    const has  = u.perms.includes(p);
    u.perms    = has ? u.perms.filter(x => x !== p) : [...u.perms, p];

    const idx = this.users.findIndex(x => x.id === u.id);
    if (idx !== -1) this.users[idx] = { ...u };
    this.selectedUser = { ...u };

    // Guardar en BD
    this.apiService.updateUser(u.id, { perm_codes: u.perms }).subscribe({
      next: () => {
        if (u.username === this.permissionsService.getUser()) {
          this.permissionsService.updatePermissions(u.username, u.perms);
        }
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el permiso.' }),
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
        name: this.current.name, email: this.current.email,
        role: this.current.role, group_id: this.current.group_id,
        status: this.current.status,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Agree ✓', detail: `"${this.current.name}" actualizado.` });
          this.loadUsers();
          this.showDialog = false;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
      });
    } else {
      this.apiService.addUser({
        username: this.current.username, password: 'Temporal@123',
        name: this.current.name, email: this.current.email,
        role: this.current.role, group_id: this.current.group_id,
        status: this.current.status, perm_codes: this.current.perms,
      }).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success ✓', detail: `"${this.current.name}" creado.` });
          this.loadUsers();
          this.showDialog = false;
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
            this.messageService.add({ severity: 'error', summary: 'X — Eliminado', detail: `"${u.name}" eliminado.` });
            this.loadUsers();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }),
        });
      },
    });
  }
}
