import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
export interface Client extends TableRow {
    id: string;
    profile_id: string | null;
    first_name: string;
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
    created_at: string;
    updated_at: string;
}
export interface PageQuery {
    search: string;
    page: number;
    size: number;
}
export interface PageResult<T> {
    rows: T[];
    total: number;
}
@Injectable({ providedIn: 'root' })
export class ClientesService {
    constructor(private readonly supabase: SupabaseService) { }
    async search(query: PageQuery, archived = false): Promise<PageResult<Client>> {
        const { data, error } = await this.supabase.client.rpc('search_clients', {
            p_search: query.search, p_page: query.page, p_size: query.size, p_archived: archived,
        });
        if (error)
            throw error;
        return data as PageResult<Client>;
    }
    async own(query: PageQuery): Promise<PageResult<Client>> {
        const { data: auth, error: authError } = await this.supabase.client.auth.getUser();
        if (authError)
            throw authError;
        if (!auth.user)
            throw new Error('No hay sesión.');
        const { data, error } = await this.supabase.client.from('clients').select('*')
            .eq('profile_id', auth.user.id).is('deleted_at', null);
        if (error)
            throw error;
        const term = query.search.trim().toLocaleLowerCase();
        const rows = (data as Client[]).filter(c => [c.first_name, c.last_name, c.phone, c.whatsapp, c.tax_doc_number].join(' ').toLocaleLowerCase().includes(term));
        return { rows: query.page === 1 ? rows : [], total: rows.length };
    }
    async getAll(): Promise<Client[]> {
        const rows: Client[] = [];
        for (let page = 1;; page++) {
            const result = await this.search({ search: '', page, size: 100 });
            rows.push(...result.rows);
            if (rows.length >= result.total || !result.rows.length)
                return rows;
        }
    }
    private validate(client: TableRow): void {
        if (!String(client['first_name'] ?? '').trim())
            throw new Error('El nombre del cliente es obligatorio.');
        const email = String(client['email'] ?? '').trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            throw new Error('El correo no es válido.');
    }
    async create(client: TableRow): Promise<void> {
        this.validate(client);
        const { data, error } = await this.supabase.client.rpc('save_client', { p_input: client });
        if (error)
            throw error;
        if (!data)
            throw new Error('No se creó el cliente.');
    }
    async update(client: TableRow): Promise<void> {
        this.validate(client);
        const { data, error } = await this.supabase.client.rpc('save_client', { p_input: client, p_id: client['id'] });
        if (error)
            throw error;
        if (!data)
            throw new Error('No se actualizó el cliente.');
    }
    async remove(client: TableRow): Promise<void> {
        const { error } = await this.supabase.client.rpc('retire_client', { p_id: client['id'] });
        if (error)
            throw error;
    }
}
