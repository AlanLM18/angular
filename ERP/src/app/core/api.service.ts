import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

const API_URL = 'https://devoted-comfort-production.up.railway.app/api';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  private headers(): HttpHeaders {
    const token = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('token') ?? '')
      : '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });
  }

  private deleteHeaders(): HttpHeaders {
    const token = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('token') ?? '')
      : '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/login`, { username, password });
  }

  register(body: any): Observable<any> {
    return this.http.post(`${API_URL}/auth/register`, body);
  }

  // ── USERS ─────────────────────────────────────────────────────────────────
  getUsers(): Observable<any> {
    return this.http.get(`${API_URL}/users`, { headers: this.headers() });
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${API_URL}/users/${id}`, { headers: this.headers() });
  }

  addUser(body: any): Observable<any> {
    return this.http.post(`${API_URL}/users`, body, { headers: this.headers() });
  }

  updateUser(id: number, body: any): Observable<any> {
    return this.http.put(`${API_URL}/users/${id}`, body, { headers: this.headers() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/users/${id}`, { headers: this.deleteHeaders() });
  }

  // ── GROUPS ────────────────────────────────────────────────────────────────
  getGroups(): Observable<any> {
    return this.http.get(`${API_URL}/groups`, { headers: this.headers() });
  }

  getGroupMembers(groupId: number): Observable<any> {
    return this.http.get(`${API_URL}/groups/${groupId}/members`, { headers: this.headers() });
  }

  // FIX: asegurar que los parámetros se convierten a number antes de armar la URL
  getGroupPermissions(groupId: number, userId: number): Observable<any> {
    return this.http.get(
      `${API_URL}/groups/${Number(groupId)}/permissions/${Number(userId)}`,
      { headers: this.headers() }
    );
  }

  createGroup(body: any): Observable<any> {
    return this.http.post(`${API_URL}/groups`, body, { headers: this.headers() });
  }

  updateGroup(id: number, body: any): Observable<any> {
    return this.http.put(`${API_URL}/groups/${id}`, body, { headers: this.headers() });
  }

  deleteGroup(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/groups/${id}`, { headers: this.deleteHeaders() });
  }

  addGroupMember(groupId: number, body: any): Observable<any> {
    return this.http.post(`${API_URL}/groups/${groupId}/members`, body, { headers: this.headers() });
  }

  removeGroupMember(groupId: number, userId: number): Observable<any> {
    return this.http.delete(`${API_URL}/groups/${groupId}/members/${userId}`, { headers: this.deleteHeaders() });
  }

  getMyGroups(): Observable<any> {
    return this.http.get(`${API_URL}/groups/my`, { headers: this.headers() });
  }

  getUserGroups(userId: number): Observable<any> {
    return this.http.get(`${API_URL}/groups/user/${Number(userId)}`, { headers: this.headers() });
  }

  // FIX: asegurar que groupId es number en la URL
  updateGroupPermissions(groupId: number, body: any): Observable<any> {
    return this.http.post(
      `${API_URL}/groups/${Number(groupId)}/permissions`,
      body,
      { headers: this.headers() }
    );
  }

  // ── TICKETS ───────────────────────────────────────────────────────────────
  getTicketsByGroup(groupId: number): Observable<any> {
    return this.http.get(`${API_URL}/tickets/group/${groupId}`, { headers: this.headers() });
  }

  getTicket(id: number): Observable<any> {
    return this.http.get(`${API_URL}/tickets/${id}`, { headers: this.headers() });
  }

  createTicket(body: any): Observable<any> {
    return this.http.post(`${API_URL}/tickets`, body, { headers: this.headers() });
  }

  updateTicket(id: number, body: any): Observable<any> {
    return this.http.put(`${API_URL}/tickets/${id}`, body, { headers: this.headers() });
  }

  updateTicketStatus(id: number, body: any): Observable<any> {
    return this.http.patch(`${API_URL}/tickets/${id}/status`, body, { headers: this.headers() });
  }

  addTicketComment(ticketId: number, body: any): Observable<any> {
    return this.http.post(`${API_URL}/tickets/${ticketId}/comments`, body, { headers: this.headers() });
  }

  deleteTicket(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/tickets/${id}`, { headers: this.deleteHeaders() });
  }
}
