// ── Mock de usuarios del sistema ──────────────────────────────────────────────
// TODO con BD: borrar este archivo. El login hará una llamada HTTP
// y users.ts obtendrá la lista desde el backend.

export interface MockUser {
  id:       number;
  username: string;
  password: string;
  name:     string;
  email:    string;
  role:     string;
  group:    string;
  status:   'active' | 'inactive';
}

export const MOCK_USERS: MockUser[] = [
  { id: 1, username: 'superAdmin', password: 'Super@99999!', name: 'Super Administrador', email: 'super@erp.com',   role: 'Super Admin', group: 'Administración', status: 'active'   },
  { id: 2, username: 'admin',      password: 'Admin@12345',  name: 'Ana García López',   email: 'ana@erp.com',     role: 'Admin',       group: 'Administración', status: 'active'   },
  { id: 3, username: 'usuario1',   password: 'User@67890!',  name: 'Usuario Uno',        email: 'u1@erp.com',      role: 'Usuario',     group: 'Soporte',        status: 'active'   },
];
