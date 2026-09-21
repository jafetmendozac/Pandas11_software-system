import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

@Injectable({ providedIn: 'root' })
export class MascotasService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<TableRow[]> {
    const { data, error } = await this.supabase.client.from('pets').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((pet) => ({
      id: pet.id,
      image: '/images/brand/brand-07.svg',
      client_id: pet.client_id ?? '',
      action: pet.name ?? '',
      birth_date: pet.birth_date ?? '',
      death_date: pet.death_date ?? '',
      amount: pet.weight ?? '',
      category: pet.breed ?? '',
      type: pet.pet_size ?? 'Pet',
      quantity: 0,
      account: pet.allergies ?? '',
      method: pet.pet_sex ?? '',
      pet_coat_type: pet.pet_coat_type ?? '',
      bites: pet.bites === true ? 'true' : 'false',
      notes: pet.notes ?? '',
      active: pet.active === false ? 'false' : 'true',
      status: pet.active === false ? 'Failed' : 'Success',
    }));
  }

  async create(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').insert({
      client_id: String(transaction['client_id'] ?? '').trim() || null,
      name: String(transaction['action'] ?? ''),
      breed: String(transaction['category'] ?? ''),
      pet_size: String(transaction['type'] ?? ''),
      weight: Number.parseFloat(String(transaction['amount'] ?? '')) || null,
      allergies: String(transaction['account'] ?? ''),
      pet_sex: String(transaction['method'] ?? ''),
      pet_coat_type: String(transaction['pet_coat_type'] ?? '') || null,
      bites: this.toBoolean(transaction['bites']),
      notes: String(transaction['notes'] ?? '').trim() || null,
      active: this.toBoolean(transaction['active'], true),
      birth_date: String(transaction['birth_date'] ?? '').trim() || null,
      death_date: String(transaction['death_date'] ?? '').trim() || null,
    });
    if (error) throw error;
  }

  async remove(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').delete().eq('id', transaction['id']);
    if (error) throw error;
  }

  async update(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').update({
      client_id: String(transaction['client_id'] ?? '').trim() || null,
      name: String(transaction['action'] ?? ''),
      breed: String(transaction['category'] ?? ''),
      pet_size: String(transaction['type'] ?? ''),
      weight: Number.parseFloat(String(transaction['amount'] ?? '')) || null,
      allergies: String(transaction['account'] ?? ''),
      pet_sex: String(transaction['method'] ?? ''),
      pet_coat_type: String(transaction['pet_coat_type'] ?? '') || null,
      bites: this.toBoolean(transaction['bites']),
      notes: String(transaction['notes'] ?? '').trim() || null,
      active: this.toBoolean(transaction['active'], true),
      birth_date: String(transaction['birth_date'] ?? '').trim() || null,
      death_date: String(transaction['death_date'] ?? '').trim() || null,
    }).eq('id', transaction['id']);
    if (error) throw error;
  }

  private toBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return fallback;
  }
}
