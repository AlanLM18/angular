import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Permission, PermissionsService } from '../../../../core/permissions';

interface ManagedUser {
  username: string;
  fullName: string;
  email: string;
  permissions: Permission[];
}

// Permisos conocidos para la UI del formulario
// (el backend los define, aquí solo los mostramos)
const ALL_KNOWN_PERMISSIONS: { label: string; icon: string; perms: Permission[] }[] = [
  { label: 'Grupos',   icon: 'pi pi-sitemap', perms: ['group:view',  'group:edit',  'group:add',  'group:delete'] },
  { label: 'Tickets',  icon: 'pi pi-ticket',  perms: ['ticket:view', 'ticket:edit', 'ticket:add', 'ticket:delete', 'ticket:edit_state'] },
  { label: 'Usuarios', icon: 'pi pi-users',   perms: ['user:view',   'users:view',  'user:edit',  'user:add',      'user:delete'] },
  { label: 'Sistema',  icon: 'pi pi-shield',  perms: ['superadmin'] },
];

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, CardModule, TagModule,
    DialogModule, InputTextModule, ToastModule,
    ConfirmDialogModule, DividerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './super-admin.html',
  styleUrls: ['./super-admin.css'],
})
export class SuperAdminComponent {
  permGroups = ALL_KNOWN_PERMISSIONS;

  users: ManagedUser[] = [
    { username: 'superAdmin', fullName: 'Super Administrador', email: 'super@erp.com',
      permissions: ['group:view','group:edit','group:add','group:delete','ticket:view','ticket:edit','ticket:add','ticket:delete','ticket:edit_state','user:view','users:view','user:edit','user:add','user:delete','superadmin'] },
    { username: 'admin', fullName: 'Administrador', email: 'admin@erp.com',
      permissions: ['group:view','group:edit','group:add','group:delete','ticket:view','ticket:edit','ticket:add','ticket:delete','ticket:edit_state','user:view','users:view','user:edit','user:add','user:delete'] },
    { username: 'usuario1', fullName: 'Usuario Uno', email: 'u1@erp.com',
      permissions: ['group:view','ticket:view','ticket:edit_state','user:view','user:edit'] },
  ];

  showDialog = false;
  showPermsDialog = false;
  isEditing = false;
  selectedUser: ManagedUser | null = null;
  draftPerms: Permission[] = [];

  emptyUser(): ManagedUser {
    return { username: '', fullName: '', email: '', permissions: [] };
  }
  current: ManagedUser = this.emptyUser();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  openCreate() {
    this.current = this.emptyUser();
    this.isEditing = false;
    this.showDialog = true;
  }

  openEdit(u: ManagedUser) {
    this.current = { ...u, permissions: [...u.permissions] };
    this.isEditing = true;
    this.showDialog = true;
  }

  save() {
    if (!this.current.username.trim() || !this.current.email.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Username y email son obligatorios.' });
      return;
    }
    if (this.isEditing) {
      const idx = this.users.findIndex(u => u.username === this.current.username);
      if (idx !== -1) this.users[idx] = { ...this.current };
      this.messageService.add({ severity: 'success', summary: 'Agree ✓', detail: `Usuario "${this.current.username}" actualizado.` });
    } else {
      if (this.users.find(u => u.username === this.current.username)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El username ya existe.' });
        return;
      }
      this.users.push({ ...this.current });
      this.messageService.add({ severity: 'success', summary: 'Success ✓', detail: `Usuario "${this.current.username}" creado.` });
    }
    this.showDialog = false;
  }

  confirmDelete(u: ManagedUser) {
    if (u.username === 'superAdmin') {
      this.messageService.add({ severity: 'warn', summary: 'No permitido', detail: 'No puedes eliminar al superAdmin.' });
      return;
    }
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario <b>${u.username}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.users = this.users.filter(x => x.username !== u.username);
        this.messageService.add({ severity: 'error', summary: 'X — Eliminado', detail: `"${u.username}" eliminado.` });
      },
    });
  }

  openPerms(u: ManagedUser) {
    this.selectedUser = u;
    this.draftPerms = [...u.permissions];
    this.showPermsDialog = true;
  }

  togglePerm(p: Permission) {
    const idx = this.draftPerms.indexOf(p);
    if (idx === -1) this.draftPerms.push(p);
    else this.draftPerms.splice(idx, 1);
  }

  hasPerm(p: Permission) { return this.draftPerms.includes(p); }

  savePerms() {
    if (!this.selectedUser) return;
    const u = this.users.find(x => x.username === this.selectedUser!.username);
    if (u) u.permissions = [...this.draftPerms];
    this.messageService.add({ severity: 'success', summary: 'Agree ✓', detail: `Permisos de "${this.selectedUser.username}" actualizados.` });
    this.showPermsDialog = false;
  }
}
