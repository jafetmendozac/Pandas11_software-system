export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type SaleItemKind = 'SERVICE' | 'PRODUCT';

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: 'UNIT';
  price: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  kind: SaleItemKind;
  appointment_item_id: string | null;
  service_id: string | null;
  product_id: string | null;
  description: string;
  unit: 'UNIT';
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Sale {
  id: string;
  client_id: string;
  client_name: string;
  appointment_id: string | null;
  status: SaleStatus;
  currency: 'PEN';
  total: string;
  confirmed_appointment_payments: string;
  requires_resolution: boolean;
  items: SaleItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface SaleDraftInput {
  request_id: string;
  client_id: string;
  appointment_id?: string | null;
  products: Array<{ product_id: string; quantity: number }>;
}

export interface SalePage { rows: Sale[]; total: number; }
export interface ProductPage { rows: Product[]; total: number; }
