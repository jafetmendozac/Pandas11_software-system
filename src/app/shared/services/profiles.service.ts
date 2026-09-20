import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export type EmployeeRole = 'ALL_SERVICES' | 'ASSISTANT';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: EmployeeRole;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<TableRow[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map((profile) => ({
      id: profile.id,
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      role: profile.role ?? 'ASSISTANT',
      active: profile.active !== false,
      status: profile.active === false ? 'Inactive' : 'Active',
    }));
  }

  async create(row: TableRow): Promise<void> {
    const { error } = await this.supabase.client.from('profiles').insert(this.toRecord(row));
    if (error) throw error;
  }

  async update(row: TableRow): Promise<void> {
    const { error } = await this.supabase.client
      .from('profiles')
      .update(this.toRecord(row, false))
      .eq('id', String(row['id'] ?? ''));
    if (error) throw error;
  }

  async remove(row: TableRow): Promise<void> {
    const { error } = await this.supabase.client.from('profiles').delete().eq('id', String(row['id'] ?? ''));
    if (error) throw error;
  }

  private toRecord(row: TableRow, includeId = true): Record<string, unknown> {
    const record: Record<string, unknown> = {
      first_name: String(row['first_name'] ?? '').trim(),
      last_name: String(row['last_name'] ?? '').trim(),
      role: row['role'] === 'ALL_SERVICES' ? 'ALL_SERVICES' : 'ASSISTANT',
      active: row['active'] === true || row['active'] === 'true' || row['status'] === 'Active',
    };
    if (includeId && String(row['id'] ?? '').trim()) record['id'] = String(row['id']).trim();
    if (String(row['auth_user_id'] ?? '').trim()) record['auth_user_id'] = String(row['auth_user_id']).trim();
    return record;
  }
}
