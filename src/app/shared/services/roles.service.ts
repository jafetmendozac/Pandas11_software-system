import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  is_system?: boolean;
}
export interface Permission { id: string; code: string; description: string; }
export interface RolePermission { role_id: string; permission_id: string; }
export type RoleInput = Omit<Role, 'id' | 'is_system'>;

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly client = inject(SupabaseService).client;

  async load(): Promise<{ roles: Role[]; permissions: Permission[]; assignments: RolePermission[] }> {
    const [roles, permissions, assignments] = await Promise.all([
      this.client.from('roles').select('id, code, name, description, active, is_system').order('name'),
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
    const { data, error } = await query.select('id, code, name, description, active, is_system').single();
    if (error) throw error;
    return data as Role;
  }

  async setRoleActive(id: string, active: boolean): Promise<Role> {
    const { data, error } = await this.client.from('roles')
      .update({ active, updated_at: new Date().toISOString() }).eq('id', id)
      .select('id, code, name, description, active, is_system').single();
    if (error) throw error;
    return data as Role;
  }

  async users(): Promise<{ id: string; first_name: string | null; last_name: string | null; active: boolean }[]> {
    const { data, error } = await this.client.from('profiles').select('id,first_name,last_name,active');
    if (error) throw error;
    return data ?? [];
  }

  async userAssignments(): Promise<{ user_id: string; role_id: string }[]> {
    const { data, error } = await this.client.from('user_roles').select('user_id,role_id');
    if (error) throw error;
    return data ?? [];
  }

  async assignUser(userId: string, roleId: string, enabled: boolean): Promise<void> {
    const query = enabled
      ? this.client.from('user_roles').insert({ user_id: userId, role_id: roleId })
      : this.client.from('user_roles').delete().eq('user_id', userId).eq('role_id', roleId);
    const { data, error } = await query.select('user_id');
    if (error) throw error;
    if (!data?.length) throw new Error('No se modificó la asignación. Comprueba tus permisos.');
  }

  async setUserActive(userId: string, active: boolean): Promise<void> {
    const { error } = await this.client.rpc('set_profile_active', { p_user_id: userId, p_active: active });
    if (error) throw error;
  }

  async setPermission(roleId: string, permissionId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      const { data, error } = await this.client.from('role_permissions')
        .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' })
        .select('role_id').single();
      if (error) throw error;
      if (!data) throw new Error('No se pudo asignar el permiso.');
    } else {
      const { data, error } = await this.client.from('role_permissions').delete()
        .eq('role_id', roleId).eq('permission_id', permissionId).select('role_id');
      if (error) throw error;
      if (!data?.length) throw new Error('No se eliminó la asignación. Actualiza la página y comprueba tus permisos de acceso.');
    }
  }
}
