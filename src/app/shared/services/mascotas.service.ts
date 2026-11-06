import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
import { PageQuery, PageResult } from './clientes.service';
import { PetPhotosService } from './pet-photos.service';
export type PetSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PetSize = 'TOY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';
export interface Pet extends TableRow {
    id: string;
    client_id: string;
    name: string;
    breed_id: string | null;
    breed_name: string | null;
    pet_sex: PetSex | null;
    pet_size: PetSize | null;
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
    photo_url: string | null;
    photo_signed_url?: string | null;
    client_name?: string;
}

interface PetDetailRow extends Omit<Pet, 'breed_name' | 'client_name'> {
    pet_breeds: { name: string } | null;
    clients: { first_name: string; last_name: string | null; deleted_at: string | null } | null;
}

@Injectable({ providedIn: 'root' })
export class MascotasService {
    constructor(private readonly supabase: SupabaseService, private readonly photos: PetPhotosService) { }
    async search(query: PageQuery, archived = false, clientId: string | null = null): Promise<PageResult<Pet>> {
        const { data, error } = await this.supabase.client.rpc('search_pets', {
            p_search: query.search, p_page: query.page, p_size: query.size, p_archived: archived, p_client: clientId,
        });
        if (error)
            throw error;
        const result = data as PageResult<Pet>;
        return { ...result, rows: await Promise.all(result.rows.map(pet => this.withPhotoUrl(pet))) };
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
    async get(id: string, archived = false): Promise<Pet | null> {
        const { data, error } = await this.supabase.client.from('pets')
            .select('id,client_id,name,breed_id,photo_url,pet_sex,pet_size,weight_kg,allergies,bites,client_notes,birth_date,death_date,active,deleted_at,created_at,updated_at,pet_breeds(name),clients!inner(first_name,last_name,deleted_at)')
            .eq('id', id).maybeSingle();
        if (error)
            throw error;
        if (!data)
            return null;
        const row = data as unknown as PetDetailRow;
        if (Boolean(row['deleted_at'] || row.clients?.deleted_at) !== archived)
            return null;
        const { pet_breeds, clients, ...pet } = row;
        return this.withPhotoUrl({
            ...pet,
            breed_name: pet_breeds?.name ?? null,
            client_name: clients ? `${clients.first_name} ${clients.last_name ?? ''}`.trim() : undefined,
        } as Pet);
    }
    private async withPhotoUrl(pet: Pet): Promise<Pet> {
        try { return { ...pet, photo_signed_url: await this.photos.signedUrl(pet.photo_url) }; }
        catch { return { ...pet, photo_signed_url: null }; }
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
            name, breed_id: text('breed_id'), pet_sex: text('pet_sex'), pet_size: text('pet_size'),
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
