import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
import type { PageQuery, PageResult } from './clientes.service';
import type { PetSize } from './mascotas.service';
import { money, minutes } from './service-pricing.models';
export type { PetSize } from './mascotas.service';
export interface ServicePrice extends TableRow {
  id: string; service_id: string; service_name: string; pet_size: PetSize;
  price: string; duration_minutes: number;
}
export interface ServiceQuote {
  service_id: string; price: string; duration_minutes: number; rule_id: string | null;
  source: 'SIZE' | 'BASE';
}
@Injectable({ providedIn: 'root' })
export class TarifasService {
  constructor(private readonly supabase: SupabaseService) {}
  async search(query: PageQuery): Promise<PageResult<ServicePrice>> {
    const { data, error } = await this.supabase.client.rpc('search_service_prices', {
      p_search: query.search, p_page: query.page, p_size: query.size,
    });
    if (error) throw error;
    return data as PageResult<ServicePrice>;
  }
  async getAll(): Promise<ServicePrice[]> {
    const rows: ServicePrice[] = [];
    for (let page = 1; ; page++) {
      const result = await this.search({ search: '', page, size: 100 });
      rows.push(...result.rows);
      if (rows.length >= result.total || !result.rows.length) return rows;
    }
  }
  private payload(row: TableRow): Record<string, unknown> {
    if (!row['service_id']) throw new Error('Selecciona un servicio.');
    if (!row['pet_size']) throw new Error('Selecciona un tamaño.');
    return {
      service_id: row['service_id'], pet_size: String(row['pet_size']),
      price: money(row['price']), duration_minutes: minutes(row['duration_minutes']),
    };
  }
  async create(row: TableRow): Promise<void> {
    const payload = this.payload(row);
    const { data, error } = await this.supabase.client.from('service_prices').insert(payload).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se creó la tarifa.');
  }
  async update(row: TableRow): Promise<void> {
    const payload = this.payload(row);
    const { data, error } = await this.supabase.client.from('service_prices').update(payload).eq('id', row['id']).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se actualizó la tarifa.');
  }
  async remove(row: TableRow): Promise<void> {
    const { data, error } = await this.supabase.client.from('service_prices').delete().eq('id', row['id']).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se eliminó la tarifa.');
  }
  async quote(serviceId: string, size: PetSize | null): Promise<ServiceQuote> {
    if (!serviceId) throw new Error('Selecciona un servicio.');
    const { data, error } = await this.supabase.client.rpc('quote_service', { p_service_id: serviceId, p_size: size });
    if (error) throw error;
    return data as ServiceQuote;
  }

  async forService(serviceId: string): Promise<ServicePrice[]> {
    const { data, error } = await this.supabase.client.from('service_prices')
      .select('id,service_id,pet_size,price,duration_minutes')
      .eq('service_id', serviceId).order('pet_size');
    if (error) throw error;
    return (data as unknown as ServicePrice[]).map(row => ({ ...row, service_name: '' }));
  }

  async saveForSize(serviceId: string, size: PetSize, price: unknown, duration: unknown): Promise<void> {
    const payload = this.payload({ service_id: serviceId, pet_size: size, price, duration_minutes: duration });
    const { data, error } = await this.supabase.client.from('service_prices')
      .upsert(payload, { onConflict: 'service_id,pet_size' }).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se guardó la tarifa.');
  }

  async removeForSize(serviceId: string, size: PetSize): Promise<void> {
    const { data, error } = await this.supabase.client.from('service_prices').delete()
      .eq('service_id', serviceId).eq('pet_size', size).select('id').single();
    if (error) throw error;
    if (!data) throw new Error('No se retiró la tarifa.');
  }
}
