import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  permissions: string[];
  color: string;
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
  templateUrl: './groups.html',
  styleUrls: ['./groups.css'],
})
export class GroupsComponent {
  groups: Group[] = [
    { id: 1, name: 'Administración', description: 'Acceso total al sistema',         members: 3,  permissions: ['Crear','Editar','Eliminar','Ver'],  color: '#6366f1' },
    { id: 2, name: 'Ventas',         description: 'Gestión de ventas y productos',   members: 8,  permissions: ['Crear','Editar','Ver'],              color: '#22c55e' },
    { id: 3, name: 'Soporte',        description: 'Atención a usuarios finales',     members: 5,  permissions: ['Ver'],                               color: '#f97316' },
    { id: 4, name: 'Finanzas',       description: 'Control financiero y reportes',   members: 4,  permissions: ['Editar','Ver'],                      color: '#a855f7' },
  ];
}
