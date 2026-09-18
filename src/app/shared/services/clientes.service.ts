import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Transaction } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase.client.from('clients').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((client) => ({
      id: client.id,
      image: '/images/brand/brand-08.svg',
      action: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim(),
      date: client.created_at ?? '',
      amount: client.phone ?? '',
      category: client.email ?? '',
      type: 'Client',
      quantity: 0,
      account: client.address ?? '',
      method: 'Contact',
      status: 'Success',
    }));
  }

  async create(transaction: Transaction) {
    const [firstName, ...lastName] = transaction.action.trim().split(' ');
    return this.supabase.client.from('clients').insert({
      first_name: firstName,
      last_name: lastName.join(' '),
      phone: transaction.amount,
      email: transaction.category,
      address: transaction.account,
    });
  }

  async remove(transaction: Transaction) {
    return this.supabase.client.from('clients').delete().eq('id', transaction.id);
  }

  async update(transaction: Transaction) {
    const [firstName, ...lastName] = transaction.action.trim().split(' ');
    return this.supabase.client.from('clients').update({
      first_name: firstName,
      last_name: lastName.join(' '),
      phone: transaction.amount,
      email: transaction.category,
      address: transaction.account,
    }).eq('id', transaction.id);
  }
}
