import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<TableRow[]> {
    const { data, error } = await this.supabase.client.from('services').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map((service) => ({
      id: service.id,
      image: '/images/brand/brand-15.svg',
      action: service.name ?? '',
      date: service.duration_minutes ?? '',
      amount: service.price ?? '',
      category: service.description ?? '',
      type: service.requires_specialist ? 'Specialist' : 'General',
      quantity: 0,
      account: service.active === false ? 'Inactive' : 'Active',
      method: 'Service',
      status: service.active === false ? 'Failed' : 'Success',
    }));
  }

  async create(transaction: TableRow) {
    const { error } = await this.supabase.client.from('services').insert({
      name: String(transaction['action'] ?? ''),
      description: String(transaction['category'] ?? ''),
      price: Number.parseFloat(String(transaction['amount'] ?? '').replace(/[^0-9.]/g, '')) || 0,
      duration_minutes: Number.parseInt(String(transaction['date'] ?? ''), 10) || 0,
      requires_specialist: transaction['type'] === 'Specialist',
    });
    if (error) throw error;
  }

  async remove(transaction: TableRow) {
    const { error } = await this.supabase.client.from('services').delete().eq('id', transaction['id']);
    if (error) throw error;
  }

  async update(transaction: TableRow) {
    const { error } = await this.supabase.client.from('services').update({
      name: String(transaction['action'] ?? ''),
      description: String(transaction['category'] ?? ''),
      price: Number.parseFloat(String(transaction['amount'] ?? '').replace(/[^0-9.]/g, '')) || 0,
      duration_minutes: Number.parseInt(String(transaction['date'] ?? ''), 10) || 0,
      requires_specialist: transaction['type'] === 'Specialist',
    }).eq('id', transaction['id']);
    if (error) throw error;
  }
}
