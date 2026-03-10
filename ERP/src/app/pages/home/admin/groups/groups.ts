import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

// Permisos
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';

export interface Group {
  id: number;
  nombre: string;
  nivel: string;
  autor: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, CardModule, TagModule,
    DialogModule, InputTextModule, TextareaModule,
    InputNumberModule, ToastModule, ConfirmDialogModule, TooltipModule,
    HasPermissionDirective, // ← directiva de permisos
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './groups.html',
  styleUrls: ['./groups.css'],
})
export class GroupsComponent {
  groups: Group[] = [
    { id: 1, nombre: 'Administración', nivel: 'Alto',  autor: 'Ana García',   integrantes: 5,  tickets: 12, descripcion: 'Grupo con acceso total al sistema ERP.' },
    { id: 2, nombre: 'Ventas',         nivel: 'Medio', autor: 'Carlos López',  integrantes: 8,  tickets: 34, descripcion: 'Gestión de ventas y seguimiento de clientes.' },
    { id: 3, nombre: 'Soporte',        nivel: 'Bajo',  autor: 'María Torres',  integrantes: 6,  tickets: 57, descripcion: 'Atención y soporte a usuarios finales.' },
    { id: 4, nombre: 'Finanzas',       nivel: 'Alto',  autor: 'Luis Ramírez',  integrantes: 4,  tickets: 8,  descripcion: 'Control financiero, reportes y auditoría.' },
  ];

  nextId = 5;
  showDialog = false;
  isEditing = false;

  emptyForm(): Group {
    return { id: 0, nombre: '', nivel: '', autor: '', integrantes: 0, tickets: 0, descripcion: '' };
  }

  current: Group = this.emptyForm();
  niveles = ['Alto', 'Medio', 'Bajo'];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public permissionsService: PermissionsService, // ← público para usarlo en template
  ) {}

  openCreate() {
    this.current = this.emptyForm();
    this.isEditing = false;
    this.showDialog = true;
  }

  openEdit(g: Group) {
    this.current = { ...g };
    this.isEditing = true;
    this.showDialog = true;
  }

  save() {
    if (!this.current.nombre.trim() || !this.current.nivel || !this.current.autor.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Completa nombre, nivel y autor.' });
      return;
    }

    if (this.isEditing) {
      const idx = this.groups.findIndex(g => g.id === this.current.id);
      if (idx !== -1) this.groups[idx] = { ...this.current };
      this.messageService.add({ severity: 'success', summary: 'Agree ✓', detail: `Grupo "${this.current.nombre}" actualizado.` });
    } else {
      this.groups.push({ ...this.current, id: this.nextId++ });
      this.messageService.add({ severity: 'success', summary: 'Success ✓', detail: `Grupo "${this.current.nombre}" creado exitosamente.` });
    }

    this.showDialog = false;
  }

  confirmDelete(g: Group) {
    this.confirmationService.confirm({
      message: `¿Eliminar el grupo "<b>${g.nombre}</b>"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.groups = this.groups.filter(x => x.id !== g.id);
        this.messageService.add({ severity: 'error', summary: 'X — Eliminado', detail: `Grupo "${g.nombre}" eliminado.` });
      },
    });
  }

  get totalIntegrantes() { return this.groups.reduce((a, g) => a + g.integrantes, 0); }
  get totalTickets()     { return this.groups.reduce((a, g) => a + g.tickets, 0); }

  getNivelSeverity(nivel: string) {
    if (nivel === 'Alto')  return 'danger';
    if (nivel === 'Medio') return 'warn';
    return 'success';
  }
}
