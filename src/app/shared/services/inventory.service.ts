import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InventoryPage, InventoryInput, InventoryMovement, InventoryHistoryQuery } from './inventory.models';
import { PageResult } from './clientes.service';
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly supabase = inject(SupabaseService);
  private async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.supabase.client.rpc(name, args);
    if (error) throw error;
    return data as T;
  }
  search(search = '', page = 1): Promise<InventoryPage> {
    return this.rpc('search_inventory', { p_search: search, p_page: page, p_size: 10 });
  }
  record(input: InventoryInput): Promise<InventoryMovement> {
    return this.rpc('record_inventory_movement', { p_input: input });
  }
  history(q: InventoryHistoryQuery): Promise<PageResult<InventoryMovement>> {
    return this.rpc('search_inventory_movements', {
      p_product_id: q.productId, p_kind: q.kind || null,
      p_from: q.from ? `${q.from}T00:00:00-05:00` : null,
      p_until: q.until ? `${q.until}T00:00:00-05:00` : null,
      p_sale_id: q.saleId || null, p_page: q.page, p_size: 10,
    });
  }
}
