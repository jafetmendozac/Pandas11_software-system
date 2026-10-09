import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}
export interface Permission { id: string; code: string; description: string; }
export interface RolePermission { role_id: string; permission_id: string; }
export type RoleInput = Omit<Role, 'id'>;

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly client = inject(SupabaseService).client;

  async load(): Promise<{ roles: Role[]; permissions: Permission[]; assignments: RolePermission[] }> {
    const [roles, permissions, assignments] = await Promise.all([
      this.client.from('roles').select('id, code, name, description, active').order('name'),
      this.client.from('permissions').select('id, code, description').order('code'),
      this.client.from('role_permissions').select('role_id, permission_id'),
    ]);
    for (const result of [roles, permissions, assignments]) if (result.error) throw result.error;
    return { roles: roles.data ?? [], permissions: permissions.data ?? [], assignments: assignments.data ?? [] };
  }

  async saveRole(input: RoleInput, id?: string): Promise<Role> {
    const query = id
      ? this.client.from('roles').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
      : this.client.from('roles').insert(input);
    const { data, error } = await query.select('id, code, name, description, active').single();
    if (error) throw error;
    return data as Role;
  }

  async setRoleActive(id: string, active: boolean): Promise<Role> {
    const { data, error } = await this.client.from('roles')
      .update({ active, updated_at: new Date().toISOString() }).eq('id', id)
      .select('id, code, name, description, active').single();
    if (error) throw error;
    return data as Role;
  }

  async setPermission(roleId: string, permissionId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      const { data, error } = await this.client.from('role_permissions')
        .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' })
        .select('role_id').single();
      if (error) throw error;
      if (!data) throw new Error('The permission could not be assigned.');
    } else {
      const { data, error } = await this.client.from('role_permissions').delete()
        .eq('role_id', roleId).eq('permission_id', permissionId).select('role_id');
      if (error) throw error;
      if (!data?.length) throw new Error('The assignment was not removed. Refresh and check your access.');
    }
  }
}
