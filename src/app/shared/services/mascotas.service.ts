import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export interface PetRecord {
  id?: string;
  client_id: string;
  name: string;
  breed?: string;
  pet_sex?: string;
  pet_size?: string;
  bites: boolean;
  pet_coat_type?: string;
  weight?: number | null;
  allergies?: string;
  notes?: string;
  active: boolean;
  birth_date?: string | null;
  death_date?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MascotasService {
  constructor(private readonly supabase: SupabaseService) {}

  async getRecords(): Promise<PetRecord[]> {
    const { data, error } = await this.supabase.client.from('pets').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []) as PetRecord[];
  }

  async getAll(): Promise<TableRow[]> {
    const { data, error } = await this.supabase.client.from('pets').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((pet) => ({
      id: pet.id,
       client_id: pet.client_id,
      image: '/images/brand/brand-07.svg',
      action: pet.name ?? '',
      date: pet.birth_date ?? '',
      amount: pet.weight ?? '',
      category: pet.breed ?? '',
      type: pet.pet_size ?? 'Pet',
      quantity: 0,
      account: pet.allergies ?? '',
      method: pet.pet_sex ?? '',
       coat_type: pet.pet_coat_type ?? '',
       bites: pet.bites ?? false,
       notes: pet.notes ?? '',
       birth_date: pet.birth_date ?? '',
       death_date: pet.death_date ?? '',
       active: pet.active ?? true,
      status: pet.active === false ? 'Failed' : 'Success',
    }));
  }

  async create(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').insert({
      client_id: String(transaction['client_id'] ?? ''),
      name: String(transaction['action'] ?? ''),
      breed: String(transaction['category'] ?? ''),
      pet_size: String(transaction['type'] ?? ''),
      weight: Number.parseFloat(String(transaction['amount'] ?? '')) || null,
      allergies: String(transaction['account'] ?? ''),
      pet_sex: String(transaction['method'] ?? ''),
      pet_coat_type: String(transaction['coat_type'] ?? '') || null,
      bites: Boolean(transaction['bites']),
      notes: String(transaction['notes'] ?? ''),
      active: transaction['status'] !== 'Inactive',
      birth_date: String(transaction['birth_date'] ?? '') || null,
      death_date: String(transaction['death_date'] ?? '') || null,
    });
    if (error) throw error;
  }

  async remove(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').delete().eq('id', transaction['id']);
    if (error) throw error;
  }

  async update(transaction: TableRow) {
    const { error } = await this.supabase.client.from('pets').update({
      client_id: String(transaction['client_id'] ?? ''),
      name: String(transaction['action'] ?? ''),
      breed: String(transaction['category'] ?? ''),
      pet_size: String(transaction['type'] ?? ''),
      weight: Number.parseFloat(String(transaction['amount'] ?? '')) || null,
      allergies: String(transaction['account'] ?? ''),
      pet_sex: String(transaction['method'] ?? ''),
      pet_coat_type: String(transaction['coat_type'] ?? '') || null,
      bites: Boolean(transaction['bites']),
      notes: String(transaction['notes'] ?? ''),
      active: transaction['status'] !== 'Inactive',
      birth_date: String(transaction['birth_date'] ?? '') || null,
      death_date: String(transaction['death_date'] ?? '') || null,
    }).eq('id', transaction['id']);
    if (error) throw error;
  }
}
