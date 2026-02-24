import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';


import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';



function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const pattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_\-+=]).{10,}$/;
  return pattern.test(value) ? null : { weakPassword: true };
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

function adultsOnlyValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const birthDate = new Date(control.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 18 ? null : { underage: true };
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value || '').replace(/\D/g, '');
  return value.length === 10 ? null : { invalidPhone: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    CardModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  form: FormGroup;
  submitted = false;
  maxDate = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        birthDate: ['', [Validators.required, adultsOnlyValidator]],
        phone: ['', [Validators.required, phoneValidator]],
        address: ['', [Validators.required, Validators.minLength(5)]],
        password: ['', [Validators.required, strongPasswordValidator]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  f(name: string) {
    return this.form.get(name)!;
  }

  isInvalid(name: string) {
    const ctrl = this.f(name);
    return (this.submitted || ctrl.touched) && ctrl.invalid;
  }

  getError(name: string): string {
    const ctrl = this.f(name);
    if (!ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es requerido.';
    if (ctrl.errors['minlength'])
      return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors['email']) return 'Ingresa un correo electrónico válido.';
    if (ctrl.errors['weakPassword'])
      return 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo (!@#$%^&*).';
    if (ctrl.errors['underage']) return 'Debes ser mayor de 18 años para registrarte.';
    if (ctrl.errors['invalidPhone']) return 'Ingresa exactamente 10 dígitos numéricos.';
    return 'Campo inválido.';
  }

  get passwordMismatch() {
    return (
      (this.submitted || this.f('confirmPassword').touched) &&
      this.form.errors?.['passwordMismatch']
    );
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor corrige los errores antes de continuar.',
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: '¡Registro exitoso!',
      detail: `Bienvenido, ${this.f('fullName').value}. Ya puedes iniciar sesión.`,
    });

    setTimeout(() => this.router.navigate(['/login']), 2000);
  }
}
