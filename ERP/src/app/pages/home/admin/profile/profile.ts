import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PermissionsService } from '../../../../core/permissions';

interface UserProfile {
  fullName:  string;
  username:  string;
  email:     string;
  phone:     string;
  address:   string;
  birthDate: string;
  role:      string;
  groups:    number;
  tickets:   number;
  activity:  string;
}

// Simula los datos que vendrían del backend por usuario
// TODO: reemplazar con llamada HTTP al tener backend
const PROFILES: Record<string, UserProfile> = {
  superAdmin: {
    fullName: 'Super Administrador', username: 'superAdmin',
    email: 'super@erp.com', phone: '5500000000',
    address: 'Oficina Central, CDMX', birthDate: '1985-01-01',
    role: 'Super Admin', groups: 4, tickets: 120, activity: '100%',
  },
  admin: {
    fullName: 'Ana García López', username: 'admin',
    email: 'ana@erp.com', phone: '5512345678',
    address: 'Av. Reforma 123, CDMX', birthDate: '1990-05-15',
    role: 'Administrador', groups: 3, tickets: 24, activity: '98%',
  },
  usuario1: {
    fullName: 'Usuario Uno', username: 'usuario1',
    email: 'u1@erp.com', phone: '5598765432',
    address: 'Calle Ficticia 456, Monterrey', birthDate: '1995-08-22',
    role: 'Usuario', groups: 1, tickets: 7, activity: '74%',
  },
};

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
export class ProfileComponent implements OnInit {
  editing = false;
  profile!: UserProfile;
  draft!: UserProfile;

  constructor(
    private messageService: MessageService,
    public permissionsService: PermissionsService,
  ) {}

  ngOnInit() {
    const username = this.permissionsService.getUser();
    // Si existe en el mock lo carga, si no genera uno genérico
    this.profile = PROFILES[username] ?? {
      fullName: username, username,
      email: `${username}@erp.com`, phone: '—',
      address: '—', birthDate: '—',
      role: 'Usuario', groups: 0, tickets: 0, activity: '0%',
    };
    this.draft = { ...this.profile };
  }

  get initials() {
    return this.profile.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  startEdit() { this.draft = { ...this.profile }; this.editing = true; }

  save() {
    this.profile = { ...this.draft };
    this.editing = false;
    this.messageService.add({ severity: 'success', summary: 'Agree ✓', detail: 'Perfil actualizado.' });
  }

  cancel() {
    this.editing = false;
    this.messageService.add({ severity: 'warn', summary: 'X — Cancelado', detail: 'Cambios descartados.' });
  }
}
