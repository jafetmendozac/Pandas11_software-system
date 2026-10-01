import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export interface Service extends TableRow {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  base_duration_minutes: number | null;
  requires_specialist: boolean | null;
  visible_to_clients: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Service[]> {
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, description, base_price, base_duration_minutes, requires_specialist, visible_to_clients, active, created_at, updated_at')
      .order('created_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Service[];
  }

  async create(service: TableRow) {
    const { error } = await this.supabase.client.from('services').insert({
      id: crypto.randomUUID(),
      name: String(service['name'] ?? ''),
      description: String(service['description'] ?? ''),
      base_price: Number(service['base_price'] ?? 0),
      base_duration_minutes: Number(service['base_duration_minutes'] ?? 0),
      requires_specialist: service['requires_specialist'] === true || service['requires_specialist'] === 'true',
      visible_to_clients: service['visible_to_clients'] !== false && service['visible_to_clients'] !== 'false',
      active: service['active'] !== false && service['active'] !== 'false',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async remove(service: TableRow) {
    const { error } = await this.supabase.client
      .from('services')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', service['id']);

    if (error) throw error;
  }

  async update(service: TableRow) {
    const { error } = await this.supabase.client.from('services').update({
      name: String(service['name'] ?? ''),
      description: String(service['description'] ?? ''),
      base_price: Number(service['base_price'] ?? 0),
      base_duration_minutes: Number(service['base_duration_minutes'] ?? 0),
      requires_specialist: service['requires_specialist'] === true || service['requires_specialist'] === 'true',
      visible_to_clients: service['visible_to_clients'] !== false && service['visible_to_clients'] !== 'false',
      active: service['active'] !== false && service['active'] !== 'false',
      updated_at: new Date().toISOString(),
    }).eq('id', service['id']);
    if (error) throw error;
  }
}
