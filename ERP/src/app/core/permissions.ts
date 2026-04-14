import { Injectable, signal } from '@angular/core';

export type Permission = string;

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private activePermissions = signal<Permission[]>([]);
  private activeUser        = signal<string>('');
  private groupPermissions  = signal<Permission[]>([]);

  setGroupPermissions(perms: Permission[]): void {
    this.groupPermissions.set([...perms]);
  }

  clearGroupPermissions(): void {
    this.groupPermissions.set([]);
  }

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
    this.groupPermissions.set([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
  }

  has(permission: Permission): boolean {
    if (this.groupPermissions().length > 0) {
      return this.groupPermissions().includes(permission);
    }
    return this.activePermissions().includes(permission);
  }

  hasAll(permissions: Permission[]): boolean {
    return permissions.every(p => this.has(p));
  }

  hasAny(permissions: Permission[]): boolean {
    return permissions.some(p => this.has(p));
  }

  getAllActive(): Permission[] {
    if (this.groupPermissions().length > 0) {
      return this.groupPermissions();
    }
    return this.activePermissions();
  }

  getAll(): Permission[] {
    return this.activePermissions();
  }

  getUser(): string {
    return this.activeUser();
  }
}
