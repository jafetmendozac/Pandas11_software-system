import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { Permission, Role, RoleInput, RolePermission, RolesService } from '../../../services/roles.service';

@Component({
  selector: 'app-role-settings',
  standalone: true,
  imports: [FormsModule, ComponentCardComponent],
  templateUrl: './role-settings.component.html',
})
export class RoleSettingsComponent implements OnInit {
  private readonly service = inject(RolesService);
  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly assignments = signal<RolePermission[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly loadFailed = signal(false);
  readonly notice = signal('');
  readonly failed = signal(false);
  readonly selectedId = signal('');
  tab: 'roles' | 'permissions' = 'roles';
  showRoleForm = false;
  editingId = '';
  role: RoleInput = this.emptyRole();
  search = '';

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.notice.set('');
    try {
      const data = await this.service.load();
      this.roles.set(data.roles);
      this.permissions.set(data.permissions);
      this.assignments.set(data.assignments);
      if (!data.roles.some(role => role.id === this.selectedId())) this.selectedId.set(data.roles[0]?.id ?? '');
      this.loadFailed.set(false);
    } catch (error) { this.loadFailed.set(true); this.showError(error); }
    finally { this.loading.set(false); }
  }

  selectedRole(): Role | undefined { return this.roles().find(role => role.id === this.selectedId()); }
  assigned(roleId: string, permissionId: string): boolean {
    return this.assignments().some(item => item.role_id === roleId && item.permission_id === permissionId);
  }
  rolePermissions(roleId: string): Permission[] {
    return this.permissions().filter(permission => this.assigned(roleId, permission.id));
  }
  filteredPermissions(): Permission[] {
    const query = this.search.trim().toLowerCase();
    return this.permissions().filter(item => `${item.code} ${item.description}`.toLowerCase().includes(query));
  }
  edit(role: Role): void {
    this.showRoleForm = true;
    this.tab = 'roles';
    this.editingId = role.id;
    this.role = { code: role.code, name: role.name, description: role.description, active: role.active };
  }
  resetRole(): void { this.editingId = ''; this.role = this.emptyRole(); this.showRoleForm = false; }

  createRole(): void { this.resetRole(); this.showRoleForm = true; }

  linkPermissions(role: Role): void { this.selectedId.set(role.id); this.tab = 'permissions'; }

  async deactivate(role: Role): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const saved = await this.service.setRoleActive(role.id, !role.active);
      this.roles.update(items => items.map(item => item.id === saved.id ? saved : item));
      if (this.editingId === role.id) this.resetRole();
      this.success(saved.active ? 'Role restored.' : 'Role deleted logically. Its permissions and history are preserved.');
    } catch (error) { this.showError(error); }
    finally { this.busy.set(false); }
  }

  async saveRole(): Promise<void> {
    if (this.busy()) return;
    const input = { ...this.role, code: this.role.code.trim(), name: this.role.name.trim(), description: this.role.description?.trim() || null };
    if (!input.code || !input.name) return this.showError(new Error('Role code and name are required.'));
    this.busy.set(true);
    try {
      const role = await this.service.saveRole(input, this.editingId || undefined);
      this.roles.update(items => [...items.filter(item => item.id !== role.id), role].sort((a, b) => a.name.localeCompare(b.name)));
      this.selectedId.set(role.id);
      this.resetRole();
      this.success('Role saved. Open Link permissions to assign access.');
    } catch (error) { this.showError(error); }
    finally { this.busy.set(false); }
  }

  async toggle(permission: Permission, event: Event): Promise<void> {
    const roleId = this.selectedId();
    (event.target as HTMLInputElement).checked = this.assigned(roleId, permission.id);
    if (!roleId || this.busy()) return;
    const enabled = !this.assigned(roleId, permission.id);
    this.busy.set(true);
    try {
      await this.service.setPermission(roleId, permission.id, enabled);
      this.assignments.update(items => enabled
        ? [...items, { role_id: roleId, permission_id: permission.id }]
        : items.filter(item => item.role_id !== roleId || item.permission_id !== permission.id));
      this.success('Role permissions updated.');
    } catch (error) { this.showError(error); }
    finally { this.busy.set(false); }
  }
  private emptyRole(): RoleInput { return { code: '', name: '', description: '', active: true }; }
  private success(message: string): void { this.failed.set(false); this.notice.set(message); }
  private showError(error: unknown): void {
    this.failed.set(true);
    const details = error as { code?: string; message?: string };
    this.notice.set(details?.code === '23505' ? 'This code or name already exists. Choose a unique value.' : details?.message || 'Unable to complete the request. Please try again.');
  }
}
