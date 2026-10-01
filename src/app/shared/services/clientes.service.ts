import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export interface Client extends TableRow {
  id: string;
  profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  tax_doc_type: string | null;
  tax_doc_number: string | null;
  business_name: string | null;
  whatsapp_opt_in: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Client[]> {
    const { data, error } = await this.supabase.client
      .from('clients')
      .select('id, profile_id, first_name, last_name, phone, whatsapp, email, address, tax_doc_type, tax_doc_number, business_name, whatsapp_opt_in, deleted_at, created_at, updated_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Client[];
  }

  async create(client: TableRow) {
    const now = new Date().toISOString();
    const { error } = await this.supabase.client.from('clients').insert({
      id: crypto.randomUUID(),
      profile_id: this.toNullableString(client['profile_id']),
      first_name: String(client['first_name'] ?? ''),
      last_name: String(client['last_name'] ?? ''),
      phone: this.toNullableString(client['phone']),
      whatsapp: this.toNullableString(client['whatsapp']),
      email: this.toNullableString(client['email']),
      address: this.toNullableString(client['address']),
      tax_doc_type: this.toNullableString(client['tax_doc_type']),
      tax_doc_number: this.toNullableString(client['tax_doc_number']),
      business_name: this.toNullableString(client['business_name']),
      whatsapp_opt_in: this.toBoolean(client['whatsapp_opt_in']),
      deleted_at: null,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;
  }

  async remove(client: TableRow) {
    const { error } = await this.supabase.client
      .from('clients')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', client['id']);
    if (error) throw error;
  }

  async update(client: TableRow) {
    const { error } = await this.supabase.client.from('clients').update({
      profile_id: this.toNullableString(client['profile_id']),
      first_name: String(client['first_name'] ?? ''),
      last_name: String(client['last_name'] ?? ''),
      phone: this.toNullableString(client['phone']),
      whatsapp: this.toNullableString(client['whatsapp']),
      email: this.toNullableString(client['email']),
      address: this.toNullableString(client['address']),
      tax_doc_type: this.toNullableString(client['tax_doc_type']),
      tax_doc_number: this.toNullableString(client['tax_doc_number']),
      business_name: this.toNullableString(client['business_name']),
      whatsapp_opt_in: this.toBoolean(client['whatsapp_opt_in']),
      updated_at: new Date().toISOString(),
    }).eq('id', client['id']);
    if (error) throw error;
  }

  private toNullableString(value: unknown): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 'true';
  }
}
