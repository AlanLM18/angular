import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, TagModule, DividerModule],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css'],
})
export class LandingPageComponent {
  features = [
    {
      icon: 'pi pi-box',
      title: 'Gestión de Inventario',
      description:
        'Controla tus productos, stock y movimientos en tiempo real desde cualquier dispositivo.',
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Reportes y Análisis',
      description:
        'Dashboards interactivos con métricas clave para tomar decisiones informadas.',
    },
    {
      icon: 'pi pi-users',
      title: 'Gestión de Usuarios',
      description:
        'Administra roles, permisos y accesos de tu equipo de forma segura y sencilla.',
    },
    {
      icon: 'pi pi-shield',
      title: 'Seguridad Avanzada',
      description:
        'Autenticación robusta y auditoría de acciones para proteger tu información.',
    },
    {
      icon: 'pi pi-bolt',
      title: 'Alto Rendimiento',
      description:
        'Arquitectura optimizada para manejar grandes volúmenes de datos sin interrupciones.',
    },
    {
      icon: 'pi pi-cloud',
      title: 'Acceso en la Nube',
      description:
        'Disponible 24/7 desde cualquier navegador, sin instalaciones adicionales.',
    },
  ];
}
