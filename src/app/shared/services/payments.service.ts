import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PageResult } from './clientes.service';
import { Payment, PaymentCandidate, PaymentInput, PaymentQuery, PaymentSummary } from './payment.models';
export class PaymentRpcError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}
@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly supabase = inject(SupabaseService);
  private async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.supabase.client.rpc(name, args);
    if (error) throw new PaymentRpcError(error.message, error.code);
    return data as T;
  }
  search(q: PaymentQuery): Promise<PageResult<Payment>> {
    return this.rpc('search_payments', { p_search: q.search, p_appointment_id: q.appointmentId || null,
      p_status: q.status || null, p_method: q.method || null, p_from: q.from || null,
      p_until: q.until || null, p_page: q.page, p_size: q.size });
  }
  candidates(search: string, page: number): Promise<PageResult<PaymentCandidate>> {
    return this.rpc('search_payment_appointments', { p_search: search, p_page: page, p_size: 10 });
  }
  summary(appointmentId: string): Promise<PaymentSummary> { return this.rpc('appointment_payment_summary', { p_appointment_id: appointmentId }); }
  get(id: string): Promise<Payment> { return this.rpc('get_payment', { p_id: id }); }
  register(input: PaymentInput): Promise<Payment> { return this.rpc('register_payment', { p_input: input }); }
  verify(p: Payment): Promise<Payment> { return this.rpc('verify_payment', { p_id: p.id, p_expected_version: p.version }); }
  reject(p: Payment, reason: string): Promise<Payment> { return this.rpc('reject_payment', { p_id: p.id, p_expected_version: p.version, p_reason: reason }); }
}
