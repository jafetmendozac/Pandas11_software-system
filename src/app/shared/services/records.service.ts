import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
export interface Deworming extends TableRow {
    id: string;
    pet_id: string;
    treatment: string;
    applied_on: string;
    next_due_on: string | null;
    created_at: string;
}
export interface InternalNote {
    notes: string | null;
    updated_by: string | null;
    updated_at: string;
}
@Injectable({ providedIn: 'root' })
export class RecordsService {
    private readonly client = inject(SupabaseService).client;
    async dewormings(petId: string): Promise<Deworming[]> {
        const rows: Deworming[] = [];
        for (let offset = 0;; offset += 100) {
            const { data, error } = await this.client.from('pet_dewormings')
                .select('id,pet_id,treatment,applied_on,next_due_on,created_at').eq('pet_id', petId)
                .order('applied_on', { ascending: false }).order('id').range(offset, offset + 99);
            if (error)
                throw error;
            rows.push(...data as Deworming[]);
            if (data.length < 100)
                return rows;
        }
    }
    async saveDeworming(petId: string, row: TableRow, update: boolean): Promise<void> {
        const treatment = String(row['treatment'] ?? '').trim();
        const applied = String(row['applied_on'] ?? '');
        const until = String(row['next_due_on'] ?? '') || null;
        if (!treatment || !applied)
            throw new Error('Completa el producto o tratamiento y la fecha de aplicación.');
        if (until && until < applied)
            throw new Error('La próxima fecha no puede ser anterior a la aplicación.');
        const payload = { treatment, applied_on: applied, next_due_on: until };
        const query = update
            ? this.client.from('pet_dewormings').update(payload).eq('id', row['id']).eq('pet_id', petId)
            : this.client.from('pet_dewormings').insert({ ...payload, pet_id: petId });
        const { data, error } = await query.select('id').single();
        if (error)
            throw error;
        if (!data)
            throw new Error('No se guardó la desparasitación.');
    }
    async note(kind: 'client' | 'pet', id: string): Promise<InternalNote | null> {
        const { data, error } = await this.client.from(kind === 'client' ? 'client_internal' : 'pet_internal')
            .select('notes,updated_by,updated_at').eq(kind === 'client' ? 'client_id' : 'pet_id', id).maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async saveNote(kind: 'client' | 'pet', id: string, notes: string, exists: boolean): Promise<void> {
        const table = kind === 'client' ? 'client_internal' : 'pet_internal';
        const key = kind === 'client' ? 'client_id' : 'pet_id';
        // No enviar autor/fecha ni la PK en el UPDATE: el servidor controla esos campos.
        const query = exists ? this.client.from(table).update({ notes }).eq(key, id) : this.client.from(table).insert({ [key]: id, notes });
        const { data, error } = await query.select(key).single();
        if (error)
            throw error;
        if (!data)
            throw new Error('No se guardó la nota.');
    }
}
