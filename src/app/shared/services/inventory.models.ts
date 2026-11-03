export type InventoryKind = 'INITIAL' | 'RECEIPT' | 'ADJUSTMENT' | 'SALE' | 'CANCELLATION';
export type InventoryDisposition = 'RESTOCK' | 'NO_RESTOCK';
export interface InventoryBalance {
  product_id: string;
  name: string;
  sku: string | null;
  active: boolean;
  quantity: number;
  initial_loaded: boolean;
  version: number;
}
export interface InventoryPage { rows: InventoryBalance[]; total: number; can_adjust: boolean; }
export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  kind: InventoryKind;
  delta: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  actor_name: string;
  created_by: string;
  created_at: string;
  sale_id: string | null;
  sale_item_id: string | null;
}
export interface InventoryInput {
  request_id: string;
  product_id: string;
  kind: 'INITIAL' | 'RECEIPT' | 'ADJUSTMENT';
  delta: number;
  reason: string;
  expected_version: number;
}
export interface InventoryHistoryQuery {
  productId: string | null;
  kind: InventoryKind | '';
  from: string;
  until: string;
  saleId: string;
  page: number;
}
export const INVENTORY_LABELS: Record<InventoryKind, string> = {
  INITIAL: 'Carga inicial', RECEIPT: 'Reposición', ADJUSTMENT: 'Ajuste',
  SALE: 'Salida por venta', CANCELLATION: 'Reposición por anulación',
};
