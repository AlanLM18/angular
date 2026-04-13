import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../core/has-permission';
import { PermissionsService } from '../../../../core/permissions';
import { ApiService } from '../../../../core/api.service';
import { STATUSES, PRIORITIES, PRIORITY_LABELS, TicketStatus, TicketPriority } from '../../../../core/ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, TagModule, InputTextModule,
    SelectModule, ToastModule, HasPermissionDirective,
  ],
  providers: [MessageService],
  templateUrl: './ticket-list.html',
  styleUrls: ['./ticket-list.css'],
})
export class TicketListComponent implements OnInit {
  tickets: any[]     = [];
  statuses           = ['', ...STATUSES];
  priorities         = ['', ...PRIORITIES];
  priorityLabels     = PRIORITY_LABELS;
  groupId            = 0;

  searchText      = '';
  filterStatus    = '';
  filterPriority  = '';
  filterAssigned  = '';
  activeQuick: 'all' | 'mine' | 'unassigned' | 'high' = 'all';
  sortField       = '';
  sortAsc         = true;

  constructor(
    public permissionsService: PermissionsService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    this.groupId = Number(this.route.snapshot.queryParamMap.get('groupId') ?? 0);
    if (isPlatformBrowser(this.platformId)) this.loadTickets();
  }

  loadTickets() {
    if (!this.groupId) return;
    this.apiService.getTicketsByGroup(this.groupId).subscribe({
      next: (res: any) => {
        this.tickets = res.data ?? [];
        this.cdr.detectChanges();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tickets.' }),
    });
  }

  get currentUser() { return this.permissionsService.getUser(); }

  get filtered(): any[] {
    let list = [...this.tickets];
    if (this.activeQuick === 'mine')       list = list.filter(t => t.assigned_to === this.currentUser);
    if (this.activeQuick === 'unassigned') list = list.filter(t => !t.assigned_to);
    if (this.activeQuick === 'high')       list = list.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');
    if (this.searchText)     list = list.filter(t => t.title.toLowerCase().includes(this.searchText.toLowerCase()));
    if (this.filterStatus)   list = list.filter(t => t.status === this.filterStatus);
    if (this.filterPriority) list = list.filter(t => t.priority === this.filterPriority);
    if (this.filterAssigned) list = list.filter(t => t.assigned_to?.toString().toLowerCase().includes(this.filterAssigned.toLowerCase()));
    if (this.sortField) {
      list.sort((a, b) => {
        const va = String(a[this.sortField] ?? '');
        const vb = String(b[this.sortField] ?? '');
        return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }

  sort(field: string) {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
  }

  sortIcon(field: string) {
    if (this.sortField !== field) return 'pi pi-sort';
    return this.sortAsc ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }

  clearFilters() {
    this.searchText = ''; this.filterStatus = '';
    this.filterPriority = ''; this.filterAssigned = '';
    this.activeQuick = 'all'; this.sortField = '';
  }

  getPriorityLabel(p: any): string {
    return this.priorityLabels[p as TicketPriority] ?? p;
  }

  getPrioritySeverity(p: any): "danger" | "warn" | "info" | "secondary" {
    if (p === 'Crítica' || p === 'Alta') return 'danger';
    if (p === 'Media-Alta') return 'warn';
    if (p === 'Media')      return 'info';
    return 'secondary';
  }

  getStatusSeverity(s: TicketStatus): "success" | "info" | "warn" | "secondary" | "contrast" | "danger" {
    const map: Record<TicketStatus, "success" | "info" | "warn" | "secondary" | "contrast" | "danger"> = {
      'Pendiente': 'secondary', 'En progreso': 'info',
      'Revisión': 'warn', 'Hecho': 'success', 'Bloqueado': 'danger',
    };
    return map[s];
  }
}
