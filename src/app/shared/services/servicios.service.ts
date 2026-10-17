import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
import type { PageQuery, PageResult } from './clientes.service';
import { money, minutes } from './service-pricing.models';
export interface Service extends TableRow {
  id: string; name: string; description: string | null; base_price: string; base_duration_minutes: number;
  requires_specialist: boolean; visible_to_clients: boolean; active: boolean; created_at: string; updated_at: string;
}
@Injectable({ providedIn: 'root' })
export class ServiciosService {
  constructor(private readonly supabase: SupabaseService) {}
  async search(query: PageQuery, active: boolean | null = null): Promise<PageResult<Service>> {
    const { data, error } = await this.supabase.client.rpc('search_services', {
      p_search: query.search, p_page: query.page, p_size: query.size, p_active: active,
    });
    if (error) throw error;
    return data as PageResult<Service>;
  }
  async getAll(active: boolean | null = null): Promise<Service[]> {
    const rows: Service[] = [];
    for (let page = 1; ; page++) {
      const result = await this.search({ search: '', page, size: 100 }, active);
      rows.push(...result.rows);
      if (rows.length >= result.total || !result.rows.length) return rows;
    }
  }
  private payload(row: TableRow): Record<string, unknown> {
    const name = String(row['name'] ?? '').trim();
    if (!name) throw new Error('El nombre del servicio es obligatorio.');
    return {
      name, description: String(row['description'] ?? '').trim() || null,
      base_price: money(row['base_price']), base_duration_minutes: minutes(row['base_duration_minutes']),
      requires_specialist: row['requires_specialist'] === true || row['requires_specialist'] === 'true',
      visible_to_clients: row['visible_to_clients'] !== false && row['visible_to_clients'] !== 'false',
      active: row['active'] !== false && row['active'] !== 'false',
    };
  }
  async create(row: TableRow): Promise<void> {
    const payload = this.payload(row);
    const { data, error } = await this.supabase.client.from('services').insert(payload).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se creó el servicio.');
  }
  async update(row: TableRow): Promise<void> {
    const payload = this.payload(row);
    const { data, error } = await this.supabase.client.from('services').update(payload).eq('id', row['id']).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se actualizó el servicio.');
  }
  async remove(row: TableRow): Promise<void> {
    const { data, error } = await this.supabase.client.from('services').update({ active: false }).eq('id', row['id']).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se desactivó el servicio.');
  }
}
