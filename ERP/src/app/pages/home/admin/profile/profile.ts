import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule,
    TagModule, DividerModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent {
  editing = false;

  profile = {
    fullName:  'Ana García López',
    username:  'admin',
    email:     'ana@erp.com',
    phone:     '5512345678',
    address:   'Av. Reforma 123, CDMX',
    birthDate: '1990-05-15',
    role:      'Administrador',
  };


  draft = { ...this.profile };

  constructor(private messageService: MessageService) {}

  startEdit() {
    this.draft = { ...this.profile };
    this.editing = true;
  }

  save() {
    this.profile = { ...this.draft };
    this.editing = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Agree ✓',
      detail: 'Perfil actualizado correctamente.',
    });
  }

  cancel() {
    this.editing = false;
    this.messageService.add({
      severity: 'warn',
      summary: 'X — Cancelado',
      detail: 'Los cambios no fueron guardados.',
    });
  }
}
