import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
import { PageQuery, PageResult } from './clientes.service';
export type PetSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PetSize = 'TOY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
export type PetCoatType = 'SHORT' | 'MEDIUM' | 'LONG' | 'WIRE' | 'CURLY' | 'HAIRLESS';
export interface Pet extends TableRow {
    id: string;
    client_id: string;
    name: string;
    breed: string | null;
    pet_sex: PetSex | null;
    pet_size: PetSize | null;
    pet_coat_type: PetCoatType | null;
    weight_kg: number | null;
    allergies: boolean;
    bites: boolean;
    client_notes: string | null;
    birth_date: string | null;
    death_date: string | null;
    active: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    client_name?: string;
}
@Injectable({ providedIn: 'root' })
export class MascotasService {
    constructor(private readonly supabase: SupabaseService) { }
    async search(query: PageQuery, archived = false, clientId: string | null = null): Promise<PageResult<Pet>> {
        const { data, error } = await this.supabase.client.rpc('search_pets', {
            p_search: query.search, p_page: query.page, p_size: query.size, p_archived: archived, p_client: clientId,
        });
        if (error)
            throw error;
        return data as PageResult<Pet>;
    }
    async getAll(): Promise<Pet[]> {
        const rows: Pet[] = [];
        for (let page = 1;; page++) {
            const result = await this.search({ search: '', page, size: 100 });
            rows.push(...result.rows);
            if (rows.length >= result.total || !result.rows.length)
                return rows;
        }
    }
    private payload(pet: TableRow): Record<string, unknown> {
        const name = String(pet['name'] ?? '').trim();
        if (!name)
            throw new Error('El nombre de la mascota es obligatorio.');
        const text = (key: string): string | null => String(pet[key] ?? '').trim() || null;
        const weight = text('weight_kg') === null ? null : Number(pet['weight_kg']);
        if (weight !== null && (!Number.isFinite(weight) || weight <= 0))
            throw new Error('El peso debe ser positivo.');
        const birth = text('birth_date'), death = text('death_date');
        if (birth && death && death < birth)
            throw new Error('El fallecimiento no puede ser anterior al nacimiento.');
        return {
            name, breed: text('breed'), pet_sex: text('pet_sex'), pet_size: text('pet_size'), pet_coat_type: text('pet_coat_type'),
            weight_kg: weight, allergies: pet['allergies'] === true || pet['allergies'] === 'true',
            bites: pet['bites'] === true || pet['bites'] === 'true', client_notes: text('client_notes'),
            birth_date: birth, death_date: death, active: pet['active'] !== false && pet['active'] !== 'false',
        };
    }
    async create(pet: TableRow): Promise<void> {
        if (!pet['client_id'])
            throw new Error('Selecciona un cliente.');
        const { data, error } = await this.supabase.client.from('pets')
            .insert({ ...this.payload(pet), client_id: pet['client_id'] }).select('id').single();
        if (error)
            throw error;
        if (!data)
            throw new Error('No se creó la mascota.');
    }
    async update(pet: TableRow): Promise<void> {
        const { data, error } = await this.supabase.client.from('pets').update(this.payload(pet)).eq('id', pet['id']).select('id').single();
        if (error)
            throw error;
        if (!data)
            throw new Error('No se actualizó la mascota.');
    }
    async remove(pet: TableRow): Promise<void> {
        const { error } = await this.supabase.client.rpc('retire_pet', { p_id: pet['id'] });
        if (error)
            throw error;
    }
}
