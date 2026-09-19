import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<TableRow[]> {
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

  async create(transaction: TableRow) {
    const [firstName, ...lastName] = String(transaction['action'] ?? '').trim().split(' ');
    const { error } = await this.supabase.client.from('clients').insert({
      first_name: firstName,
      last_name: lastName.join(' '),
      phone: String(transaction['amount'] ?? ''),
      email: String(transaction['category'] ?? ''),
      address: String(transaction['account'] ?? ''),
    });
    if (error) throw error;
  }

  async remove(transaction: TableRow) {
    const { error } = await this.supabase.client.from('clients').delete().eq('id', transaction['id']);
    if (error) throw error;
  }

  async update(transaction: TableRow) {
    const [firstName, ...lastName] = String(transaction['action'] ?? '').trim().split(' ');
    const { error } = await this.supabase.client.from('clients').update({
      first_name: firstName,
      last_name: lastName.join(' '),
      phone: String(transaction['amount'] ?? ''),
      email: String(transaction['category'] ?? ''),
      address: String(transaction['account'] ?? ''),
    }).eq('id', transaction['id']);
    if (error) throw error;
  }
}
