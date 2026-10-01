import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export type PetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

export type PetCoatType = 'SHORT' | 'MEDIUM' | 'LONG' | 'WIRE' | 'CURLY' | 'HAIRLESS';

export interface ServicePrice extends TableRow {
  id: string;
  service_id: string;
  service_name?: string;
  pet_size: PetSize;
  pet_coat_type: PetCoatType;
  price: number | null;
  duration_minutes: number | null;
}

@Injectable({ providedIn: 'root' })
export class TarifasService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<ServicePrice[]> {
    const { data, error } = await this.supabase.client
      .from('service_prices')
      .select('id, service_id, pet_size, pet_coat_type, price, duration_minutes')
      .order('service_id', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as ServicePrice[];
  }

  async create(price: TableRow) {
    const { error } = await this.supabase.client.from('service_prices').insert({
      id: crypto.randomUUID(),
      service_id: String(price['service_id'] ?? ''),
      pet_size: String(price['pet_size'] ?? 'SMALL'),
      pet_coat_type: String(price['pet_coat_type'] ?? 'SHORT'),
      price: Number(price['price'] ?? 0),
      duration_minutes: Number(price['duration_minutes'] ?? 0),
    });
    if (error) throw error;
  }

  async remove(price: TableRow) {
    const { error } = await this.supabase.client
      .from('service_prices')
      .delete()
      .eq('id', price['id']);
    if (error) throw error;
  }

  async update(price: TableRow) {
    const { error } = await this.supabase.client.from('service_prices').update({
      service_id: String(price['service_id'] ?? ''),
      pet_size: String(price['pet_size'] ?? 'SMALL'),
      pet_coat_type: String(price['pet_coat_type'] ?? 'SHORT'),
      price: Number(price['price'] ?? 0),
      duration_minutes: Number(price['duration_minutes'] ?? 0),
    }).eq('id', price['id']);
    if (error) throw error;
  }
}
