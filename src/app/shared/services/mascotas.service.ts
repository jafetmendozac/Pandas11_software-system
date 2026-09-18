import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Transaction } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

@Injectable({ providedIn: 'root' })
export class MascotasService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase.client.from('pets').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((pet) => ({
      id: pet.id,
      image: '/images/brand/brand-07.svg',
      action: pet.name ?? '',
      date: pet.birth_date ?? '',
      amount: pet.weight ? `${pet.weight} kg` : '',
      category: pet.breed ?? '',
      type: pet.pet_size ?? 'Pet',
      quantity: 0,
      account: pet.allergies ?? '',
      method: pet.pet_sex ?? '',
      status: pet.active === false ? 'Failed' : 'Success',
    }));
  }

  async create(transaction: Transaction) {
    return this.supabase.client.from('pets').insert({
      name: transaction.action,
      breed: transaction.category,
      pet_size: transaction.type,
      weight: Number.parseFloat(transaction.amount) || null,
      allergies: transaction.account,
      pet_sex: transaction.method,
    });
  }

  async remove(transaction: Transaction) {
    return this.supabase.client.from('pets').delete().eq('id', transaction.id);
  }

  async update(transaction: Transaction) {
    return this.supabase.client.from('pets').update({
      name: transaction.action,
      breed: transaction.category,
      pet_size: transaction.type,
      weight: Number.parseFloat(transaction.amount) || null,
      allergies: transaction.account,
      pet_sex: transaction.method,
    }).eq('id', transaction.id);
  }
}
