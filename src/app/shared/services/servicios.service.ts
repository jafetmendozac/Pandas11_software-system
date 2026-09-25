import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export interface Service extends TableRow {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  requires_specialist: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Service[]> {
    const { data, error } = await this.supabase.client.from('services').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []) as Service[];
  }

  async create(service: TableRow) {
    const { error } = await this.supabase.client.from('services').insert({
      name: String(service['name'] ?? ''),
      description: String(service['description'] ?? ''),
      price: Number(service['price'] ?? 0),
      duration_minutes: Number(service['duration_minutes'] ?? 0),
      requires_specialist: service['requires_specialist'] === true || service['requires_specialist'] === 'true',
      active: service['active'] !== false && service['active'] !== 'false',
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
      price: Number(service['price'] ?? 0),
      duration_minutes: Number(service['duration_minutes'] ?? 0),
      requires_specialist: service['requires_specialist'] === true || service['requires_specialist'] === 'true',
      active: service['active'] !== false && service['active'] !== 'false',
      updated_at: new Date().toISOString(),
    }).eq('id', service['id']);
    if (error) throw error;
  }
}
