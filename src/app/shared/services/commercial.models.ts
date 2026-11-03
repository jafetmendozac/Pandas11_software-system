import { PaymentMethod, PaymentStatus } from './payment.models';

export interface SalePayment {
  id: string;
  sale_id: string;
  client_name: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  operation_code: string | null;
  external_ref: string | null;
  created_at: string;
  created_by: string;
  verified_by: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
  version: number;
}
export interface SalePaymentSummary {
  sale_id: string;
  status: string;
  sale_total: string;
  service_total: string;
  product_total: string;
  product_paid: string;
  product_pending: string;
  product_outstanding: string;
  appointment_paid: string;
}
export interface CashSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  opening_cash: string;
  opened_at: string;
  opened_by: string;
  counted_cash: string | null;
  expected_cash: string;
  difference: string | null;
  closed_at: string | null;
  closed_by: string | null;
  version: number;
  totals: Partial<Record<PaymentMethod, string>>;
}
export interface CashMovement {
  id: string;
  session_id: string;
  source: 'APPOINTMENT_PAYMENT' | 'SALE_PAYMENT' | 'MANUAL_IN' | 'MANUAL_OUT';
  method: PaymentMethod;
  amount: string;
  reason: string;
  created_at: string;
  created_by: string;
  appointment_payment_id: string | null;
  sale_payment_id: string | null;
}
export interface CashMovementInput {
  session_id: string;
  source: 'MANUAL_IN' | 'MANUAL_OUT';
  amount: string;
  reason: string;
  request_id: string;
}
export interface Paged<T> { rows: T[]; total: number; }
