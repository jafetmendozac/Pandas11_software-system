import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export type SkillLevel = 'ALL_SERVICES' | 'ASSISTANT';

export interface Employee extends TableRow {
  id: string;
  profile_id: string;
  phone: string | null;
  skill_level: SkillLevel;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Employee[]> {
    const { data, error } = await this.supabase.client
      .from('employees')
      .select('id, profile_id, phone, skill_level, active, created_at, updated_at')
      .order('created_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Employee[];
  }

  async create(employee: TableRow) {
    const { error } = await this.supabase.client.from('employees').insert({
      id: crypto.randomUUID(),
      profile_id: String(employee['profile_id'] ?? ''),
      phone: String(employee['phone'] ?? ''),
      skill_level: String(employee['skill_level'] ?? 'ALL_SERVICES'),
      active: employee['active'] !== false && employee['active'] !== 'false',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async remove(employee: TableRow) {
    const { error } = await this.supabase.client
      .from('employees')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employee['id']);
    if (error) throw error;
  }

  async update(employee: TableRow) {
    const { error } = await this.supabase.client.from('employees').update({
      profile_id: String(employee['profile_id'] ?? ''),
      phone: String(employee['phone'] ?? ''),
      skill_level: String(employee['skill_level'] ?? 'ALL_SERVICES'),
      active: employee['active'] !== false && employee['active'] !== 'false',
      updated_at: new Date().toISOString(),
    }).eq('id', employee['id']);
    if (error) throw error;
  }
}
