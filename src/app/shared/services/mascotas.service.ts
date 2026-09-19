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
      action: pet.name ?? '',
      date: pet.birth_date ?? '',
      amount: pet.weight ?? '',
      category: pet.breed ?? '',
      type: pet.pet_size ?? 'Pet',
      quantity: 0,
      account: pet.allergies ?? '',
      method: pet.pet_sex ?? '',
      status: pet.active === false ? 'Failed' : 'Success',
    }));
  }

  async create(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').insert({
      name: String(transaction['action'] ?? ''),
      breed: String(transaction['category'] ?? ''),
      pet_size: String(transaction['type'] ?? ''),
      weight: Number.parseFloat(String(transaction['amount'] ?? '')) || null,
      allergies: String(transaction['account'] ?? ''),
      pet_sex: String(transaction['method'] ?? ''),
    });
    if (error) throw error;
  }

  async remove(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').delete().eq('id', transaction['id']);
    if (error) throw error;
  }

  async update(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').update({
      name: String(transaction['action'] ?? ''),
      breed: String(transaction['category'] ?? ''),
      pet_size: String(transaction['type'] ?? ''),
      weight: Number.parseFloat(String(transaction['amount'] ?? '')) || null,
      allergies: String(transaction['account'] ?? ''),
      pet_sex: String(transaction['method'] ?? ''),
    }).eq('id', transaction['id']);
    if (error) throw error;
  }
}
