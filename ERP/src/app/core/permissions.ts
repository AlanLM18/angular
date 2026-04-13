import { Injectable, signal } from '@angular/core';

export type Permission = string;

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private activePermissions = signal<Permission[]>([]);
  private activeUser        = signal<string>('');

  setUserPermissions(username: string, perms: Permission[] = []): void {
    this.activeUser.set(username);
    this.activePermissions.set(perms);
  }

  updatePermissions(username: string, perms: Permission[]): void {
    localStorage.setItem('erp_user_perms', JSON.stringify({ [username]: perms }));
    if (username === this.activeUser()) {
      this.activePermissions.set([...perms]);
    }
  }

  clear(): void {
    this.activeUser.set('');
    this.activePermissions.set([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
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
