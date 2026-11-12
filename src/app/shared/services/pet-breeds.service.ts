import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
import type { PageQuery, PageResult } from './clientes.service';
export interface PetBreed extends TableRow {
  id: string; name: string; active: boolean; created_at: string; updated_at: string;
}
@Injectable({ providedIn: 'root' })
export class PetBreedsService {
  constructor(private readonly supabase: SupabaseService) {}
  async search(query: PageQuery, active: boolean | null = null): Promise<PageResult<PetBreed>> {
    let request = this.supabase.client.from('pet_breeds').select('*', { count: 'exact' })
      .ilike('name', `%${query.search ?? ''}%`);
    if (active !== null) request = request.eq('active', active);
    const { data, error, count } = await request.order('name', { ascending: true })
      .range((query.page - 1) * query.size, query.page * query.size - 1);
    if (error) throw error;
    return { rows: (data ?? []) as PetBreed[], total: count ?? 0 };
  }
  async getAll(active: boolean | null = null): Promise<PetBreed[]> {
    const rows: PetBreed[] = [];
    for (let page = 1; ; page++) {
      const result = await this.search({ search: '', page, size: 100 }, active);
      rows.push(...result.rows);
      if (rows.length >= result.total || !result.rows.length) return rows;
    }
  }
  private payload(row: TableRow): Record<string, unknown> {
    const name = String(row['name'] ?? '').trim();
    if (!name) throw new Error('El nombre de la raza es obligatorio.');
    return {
      name, active: row['active'] !== false && row['active'] !== 'false',
    };
  }
  async create(row: TableRow): Promise<PetBreed> {
    const payload = this.payload(row);
    const { data, error } = await this.supabase.client.from('pet_breeds').insert(payload).select('id, name, active, created_at, updated_at').single();
    if (error) throw error;
    if (!data) throw new Error('No se creó la raza.');
    return data as PetBreed;
  }
  async update(row: TableRow): Promise<void> {
    const payload = this.payload(row);
    const { data, error } = await this.supabase.client.from('pet_breeds').update(payload).eq('id', row['id']).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se actualizó la raza.');
  }
  async remove(row: TableRow): Promise<void> {
    const { error } = await this.supabase.client.from('pet_breeds').delete().eq('id', row['id']);
    if (error) throw error;
  }
}
