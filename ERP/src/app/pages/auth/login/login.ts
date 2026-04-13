import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ApiService } from '../../../core/api.service';
import { PermissionsService } from '../../../core/permissions';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputTextModule,
            PasswordModule, ButtonModule, MessageModule, ToastModule, CardModule],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  username  = '';
  password  = '';
  submitted = false;
  loading   = false;

  constructor(
    private messageService: MessageService,
    private router: Router,
    private apiService: ApiService,
    private permissionsService: PermissionsService,
  ) {}

  get usernameInvalid() { return this.submitted && !this.username.trim(); }
  get passwordInvalid()  { return this.submitted && !this.password.trim(); }

  login() {
    this.submitted = true;
    if (!this.username.trim() || !this.password.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Completa todos los campos.' });
      return;
    }

    this.loading = true;

    this.apiService.login(this.username, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        const { token, user, perms } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id.toString());

        // Cargar permisos en el servicio
        this.permissionsService.setUserPermissions(user.username, perms);

        this.messageService.add({ severity: 'success', summary: '¡Bienvenido!', detail: `Hola, ${user.name}.` });
        setTimeout(() => this.router.navigate(['/home/dashboard']), 1500);
      },
      error: (err) => {
        this.loading = false;
        console.log('Error completo:', err);
        console.log('err.error:', err.error);
        const msg = err.error?.data?.[0]?.error ?? err.error?.error ?? 'Credenciales incorrectas.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
