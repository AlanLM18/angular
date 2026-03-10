import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { PermissionsService } from '../../../core/permissions';

const VALID_CREDENTIALS = [
  { username: 'superAdmin', password: 'Super@99999!' },
  { username: 'admin',      password: 'Admin@12345'  },
  { username: 'usuario1',   password: 'User@67890!'  },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule, ToastModule, CardModule],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  username = '';
  password = '';
  submitted = false;

  constructor(
    private messageService: MessageService,
    private router: Router,
    private permissionsService: PermissionsService,
  ) {}

  get usernameInvalid() { return this.submitted && !this.username.trim(); }
  get passwordInvalid()  { return this.submitted && !this.password.trim(); }

  login() {
    this.submitted = true;
    if (!this.username.trim() || !this.password.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Por favor completa todos los campos.' });
      return;
    }
    const found = VALID_CREDENTIALS.find(c => c.username === this.username && c.password === this.password);
    if (found) {
      this.permissionsService.setUserPermissions(found.username);
      this.messageService.add({ severity: 'success', summary: '¡Bienvenido!', detail: `Hola, ${this.username}.` });
      setTimeout(() => this.router.navigate(['/home']), 1500);
    } else {
      this.messageService.add({ severity: 'error', summary: 'Credenciales incorrectas', detail: 'Usuario o contraseña inválidos.' });
    }
  }
}
