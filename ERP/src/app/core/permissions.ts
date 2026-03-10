

export type Permission =
  | 'group:view'   | 'group:edit'   | 'group:add'   | 'group:delete'
  | 'ticket:view'  | 'ticket:edit'  | 'ticket:add'  | 'ticket:delete' | 'ticket:edit_state'
  | 'user:view'    | 'users:view'   | 'user:edit'   | 'user:add'      | 'user:delete';



export const Grupo: Permission[] = [
  'group:view',
  'group:edit',
  'group:add',
  'group:delete',
];

export const Ticket: Permission[] = [
  'ticket:view',
  'ticket:edit',
  'ticket:add',
  'ticket:delete',
  'ticket:edit_state',
];

export const User: Permission[] = [
  'user:view',
  'users:view',
  'user:edit',
  'user:add',
  'user:delete',
];

export const CommonUser: Permission[] = [
  'group:view',
  'ticket:view',
  'ticket:edit_state',
  'user:view',
  'user:edit',
];


export const USER_PERMISSIONS: Record<string, Permission[]> = {
  admin:    [...Grupo, ...Ticket, ...User],
  usuario1: [...CommonUser],
};


import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private activePermissions = signal<Permission[]>([]);
  private activeUser        = signal<string>('');


  setUserPermissions(username: string): void {
    this.activeUser.set(username);
    this.activePermissions.set(USER_PERMISSIONS[username] ?? []);
  }


  clear(): void {
    this.activeUser.set('');
    this.activePermissions.set([]);
  }


  has(permission: Permission): boolean {
    return this.activePermissions().includes(permission);
  }


  hasAll(permissions: Permission[]): boolean {
    return permissions.every(p => this.activePermissions().includes(p));
  }


  hasAny(permissions: Permission[]): boolean {
    return permissions.some(p => this.activePermissions().includes(p));
  }


  getAll(): Permission[] {
    return this.activePermissions();
  }


  getUser(): string {
    return this.activeUser();
  }
}
