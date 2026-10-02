import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';

export type PetSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
export type PetCoatType = 'SHORT' | 'MEDIUM' | 'LONG' | 'WIRE' | 'CURLY' | 'HAIRLESS';

export interface Pet extends TableRow {
  id: string;
  client_id: string;
  name: string | null;
  breed: string | null;
  pet_sex: PetSex | null;
  pet_size: PetSize | null;
  pet_coat_type: PetCoatType | null;
  weight_kg: number | null;
  allergies: string | null;
  bites: boolean;
  client_notes: string | null;
  birth_date: string | null;
  death_date: string | null;
  active: boolean;
  deleted_at: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class MascotasService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Pet[]> {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select(
        'id, client_id, name, breed, pet_sex, pet_size, pet_coat_type, weight_kg, allergies, bites, client_notes, birth_date, death_date, active, deleted_at, created_at, updated_at'
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return ((data ?? []) as Pet[]).map((pet) => ({
      ...pet,
      created_at: this.formatDateTime(pet.created_at),
    }));
  }

  async create(pet: TableRow) {
    const clientId = String(pet['client_id'] ?? '').trim();
    if (!clientId) throw new Error('Selecciona un cliente para la mascota.');

    const now = new Date().toISOString();
    const { error } = await this.supabase.client.from('pets').insert({
      id: crypto.randomUUID(),
      client_id: clientId,
      name: this.toNullableString(pet['name']),
      breed: this.toNullableString(pet['breed']),
      pet_sex: this.toNullableString(pet['pet_sex']),
      pet_size: this.toNullableString(pet['pet_size']),
      pet_coat_type: this.toNullableString(pet['pet_coat_type']),
      weight_kg: this.toNullableNumber(pet['weight_kg']),
      allergies: this.toNullableString(pet['allergies']),
      bites: this.toBoolean(pet['bites']),
      client_notes: this.toNullableString(pet['client_notes']),
      birth_date: this.toNullableString(pet['birth_date']),
      death_date: this.toNullableString(pet['death_date']),
      active: pet['active'] !== false && pet['active'] !== 'false',
      deleted_at: null,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;
  }

  async remove(pet: TableRow) {
    const now = new Date().toISOString();
    const { error } = await this.supabase.client
      .from('pets')
      .update({
        deleted_at: now,
        active: false,
        updated_at: now,
      })
      .eq('id', pet['id']);
    if (error) throw error;
  }

  async update(pet: TableRow) {
    const clientId = String(pet['client_id'] ?? '').trim();
    if (!clientId) throw new Error('Selecciona un cliente para la mascota.');

    const { error } = await this.supabase.client
      .from('pets')
      .update({
        client_id: clientId,
        name: this.toNullableString(pet['name']),
        breed: this.toNullableString(pet['breed']),
        pet_sex: this.toNullableString(pet['pet_sex']),
        pet_size: this.toNullableString(pet['pet_size']),
        pet_coat_type: this.toNullableString(pet['pet_coat_type']),
        weight_kg: this.toNullableNumber(pet['weight_kg']),
        allergies: this.toNullableString(pet['allergies']),
        bites: this.toBoolean(pet['bites']),
        client_notes: this.toNullableString(pet['client_notes']),
        birth_date: this.toNullableString(pet['birth_date']),
        death_date: this.toNullableString(pet['death_date']),
        active: pet['active'] !== false && pet['active'] !== 'false',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pet['id']);
    if (error) throw error;
  }

  private formatDateTime(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    return isoDate.replace('T', ' ').slice(0, 16);
  }

  private toNullableString(value: unknown): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }

  private toNullableNumber(value: unknown): number | null {
    const parsed = Number.parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }
}
