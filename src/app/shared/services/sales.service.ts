import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product, ProductPage, Sale, SaleDraftInput, SalePage } from './sale.models';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly supabase = inject(SupabaseService);

  // Consulta autorizada de agenda, sin cargar todas las páginas.
  appointments(search = '', page = 1): Promise<import('./clientes.service').PageResult<import('./appointment.models').Appointment>> {
    return this.rpc('search_appointments', { p_from: '2000-01-01T00:00:00Z', p_until: '2100-01-01T00:00:00Z', p_page: page, p_size: 10, p_status: 'COMPLETED', p_search: search });
  }
  private async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.supabase.client.rpc(name, args);
    if (error) throw error;
    return data as T;
  }

  saveProduct(input: { id?: string | null; name: string; sku: string | null; price: string; active: boolean }): Promise<Product> {
    return this.rpc('save_product', { p_id: input.id ?? null, p_name: input.name, p_sku: input.sku,
      p_price: input.price, p_active: input.active });
  }

  products(search = '', page = 1, size = 10, active: boolean | null = null): Promise<ProductPage> {
    return this.rpc('search_products', { p_search: search, p_page: page, p_size: size, p_active: active });
  }

  createDraft(input: SaleDraftInput): Promise<Sale> { return this.rpc('create_sale_draft', { p_input: input }); }
  get(id: string): Promise<Sale> { return this.rpc('get_sale', { p_id: id }); }
  search(search = '', page = 1, size = 10): Promise<SalePage> {
    return this.rpc('search_sales', { p_search: search, p_page: page, p_size: size });
  }
  confirm(sale: Sale): Promise<Sale> {
    return this.rpc('confirm_sale', { p_id: sale.id, p_expected_version: sale.version });
  }
  cancel(sale: Sale, reason: string, disposition: import('./inventory.models').InventoryDisposition | null = null): Promise<Sale> {
    return this.rpc('cancel_sale', { p_id: sale.id, p_expected_version: sale.version, p_reason: reason, p_disposition: disposition });
  }
}
