export type TicketStatus   = 'Pendiente' | 'En progreso' | 'Revisión' | 'Hecho' | 'Bloqueado';
export type TicketPriority = '最高' | '高' | '中高' | '中' | '中低' | '低' | '最低';

export interface TicketComment {
  id: number; author: string; text: string; date: Date;
}
export interface TicketHistory {
  id: number; field: string; from: string; to: string; by: string; date: Date;
}
export interface Ticket {
  id: number; title: string; description: string;
  status: TicketStatus; assignedTo: string; priority: TicketPriority;
  createdBy: string; createdAt: Date; dueDate: Date | null;
  comments: TicketComment[]; history: TicketHistory[]; groupId: number;
}

export const MOCK_TICKETS: Ticket[] = [
  { id: 1, title: 'Configurar autenticación JWT', description: 'Implementar login con tokens JWT y refresh tokens.',
    status: 'En progreso', assignedTo: 'admin', priority: '高', createdBy: 'admin',
    createdAt: new Date('2026-02-01'), dueDate: new Date('2026-03-15'), groupId: 1,
    comments: [{ id: 1, author: 'admin', text: 'Iniciando implementación.', date: new Date('2026-02-02') }],
    history:  [{ id: 1, field: 'status', from: 'Pendiente', to: 'En progreso', by: 'admin', date: new Date('2026-02-02') }] },
  { id: 2, title: 'Diseñar vista Kanban', description: 'Crear tablero con columnas drag & drop.',
    status: 'Pendiente', assignedTo: 'usuario1', priority: '中', createdBy: 'admin',
    createdAt: new Date('2026-02-05'), dueDate: new Date('2026-03-20'), groupId: 1,
    comments: [], history: [] },
  { id: 3, title: 'Corregir bug en registro', description: 'El formulario de registro no valida el teléfono.',
    status: 'Revisión', assignedTo: 'admin', priority: '最高', createdBy: 'usuario1',
    createdAt: new Date('2026-02-10'), dueDate: new Date('2026-03-10'), groupId: 1,
    comments: [{ id: 2, author: 'usuario1', text: 'Reproducido en Firefox.', date: new Date('2026-02-11') }],
    history:  [{ id: 2, field: 'status', from: 'Pendiente', to: 'Revisión', by: 'usuario1', date: new Date('2026-02-11') }] },
  { id: 4, title: 'Documentar API REST', description: 'Agregar Swagger a todos los endpoints.',
    status: 'Hecho', assignedTo: 'usuario1', priority: '低', createdBy: 'admin',
    createdAt: new Date('2026-01-20'), dueDate: new Date('2026-02-28'), groupId: 1,
    comments: [], history: [] },
  { id: 5, title: 'Integrar PrimeNG Kanban', description: 'Investigar opciones de drag & drop.',
    status: 'Bloqueado', assignedTo: 'admin', priority: '中高', createdBy: 'admin',
    createdAt: new Date('2026-02-15'), dueDate: null, groupId: 2,
    comments: [], history: [] },
];

export const PRIORITIES: TicketPriority[] = ['最高','高','中高','中','中低','低','最低'];
export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  '最高':'最高 — Crítica','高':'高 — Alta','中高':'中高 — Media-Alta',
  '中':'中 — Media','中低':'中低 — Media-Baja','低':'低 — Baja','最低':'最低 — Mínima',
};
export const STATUSES: TicketStatus[] = ['Pendiente','En progreso','Revisión','Hecho','Bloqueado'];
