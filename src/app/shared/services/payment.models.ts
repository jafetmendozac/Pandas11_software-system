import { money } from './service-pricing.models';
import { AppointmentStatus } from './appointment.models';
export type PaymentMethod = 'YAPE' | 'PLIN' | 'CASH' | 'CARD' | 'TRANSFER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export interface Payment {
  id: string; appointment_id: string; client_id: string; client_name: string;
  appointment_status: AppointmentStatus; appointment_starts_at: string;
  type: 'BALANCE' | 'DEPOSIT' | 'REFUND'; method: PaymentMethod; status: PaymentStatus;
  amount: string; operation_code: string | null; external_ref: string | null;
  created_by: string; verified_by: string | null; paid_at: string | null;
  created_at: string; version: number; rejection_reason: string | null;
}
export interface PaymentSummary {
  appointment_id: string; client_name: string; status: AppointmentStatus; source: 'INTERNAL' | 'ONLINE';
  total: string; confirmed: string; pending: string; outstanding: string; requires_resolution: boolean;
}
export interface PaymentCandidate { id: string; client_name: string; starts_at: string; total: string; }
export interface PaymentInput {
  appointment_id: string; type: 'BALANCE'; method: PaymentMethod; amount: string;
  operation_code: string | null; external_ref: string | null; request_id: string;
}
export interface PaymentQuery {
  search: string; appointmentId: string; status: PaymentStatus | ''; method: PaymentMethod | '';
  from: string; until: string; page: number; size: number;
}
export const PAYMENT_METHODS: Record<PaymentMethod, string> = { YAPE: 'Yape', PLIN: 'Plin', CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
export const PAYMENT_STATUSES: Record<PaymentStatus, string> = { PENDING: 'Registrado, por verificar', PAID: 'Confirmado', FAILED: 'Rechazado', REFUNDED: 'Devuelto' };
export function paymentAmount(value: unknown): string {
  const text = money(value);
  if (!/[1-9]/.test(text)) throw new Error('El importe debe ser mayor que cero.');
  return text;
}
export function paymentReference(value: string): string | null {
  const text = value.trim();
  if (text.length > 120) throw new Error('Operación y referencia admiten hasta 120 caracteres.');
  return text || null;
}
