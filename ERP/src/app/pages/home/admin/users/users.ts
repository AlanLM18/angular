import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  group: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TagModule, ButtonModule, InputTextModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class UsersComponent {
  search = '';

  users: User[] = [
    { id: 1, name: 'Ana García',    email: 'ana@erp.com',    role: 'Admin',   group: 'Administración', status: 'active'   },
    { id: 2, name: 'Carlos López',  email: 'carlos@erp.com', role: 'Editor',  group: 'Ventas',         status: 'active'   },
    { id: 3, name: 'María Torres',  email: 'maria@erp.com',  role: 'Viewer',  group: 'Soporte',        status: 'inactive' },
    { id: 4, name: 'Luis Ramírez',  email: 'luis@erp.com',   role: 'Editor',  group: 'Ventas',         status: 'active'   },
    { id: 5, name: 'Paula Díaz',    email: 'paula@erp.com',  role: 'Viewer',  group: 'Soporte',        status: 'active'   },
    { id: 6, name: 'Jorge Méndez',  email: 'jorge@erp.com',  role: 'Admin',   group: 'Administración', status: 'inactive' },
  ];

  get filtered() {
    return this.users.filter(u =>
      u.name.toLowerCase().includes(this.search.toLowerCase()) ||
      u.email.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  get activeCount()   { return this.users.filter(u => u.status === 'active').length; }
  get inactiveCount() { return this.users.filter(u => u.status === 'inactive').length; }
}
