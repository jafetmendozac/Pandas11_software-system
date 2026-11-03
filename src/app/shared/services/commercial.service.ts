import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PaymentMethod } from './payment.models';
import { CashMovement, CashMovementInput, CashSession, Paged, SalePayment, SalePaymentSummary } from './commercial.models';

@Injectable({ providedIn: 'root' })
export class CommercialService {
  private readonly supabase = inject(SupabaseService);
  private async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.supabase.client.rpc(name, args);
    if (error) throw error;
    return data as T;
  }
  saleSummary(id: string): Promise<SalePaymentSummary> { return this.rpc('sale_payment_summary', { p_sale_id: id }); }
  salePayments(id: string, page = 1): Promise<Paged<SalePayment>> {
    return this.rpc('search_sale_payments', { p_sale_id: id, p_page: page, p_size: 10 });
  }
  registerSalePayment(input: { sale_id: string; amount: string; method: PaymentMethod; operation_code: string | null; external_ref: string | null; request_id: string }): Promise<SalePayment> {
    return this.rpc('register_sale_payment', { p_input: input });
  }
  verifySalePayment(payment: SalePayment): Promise<SalePayment> {
    return this.rpc('verify_sale_payment', { p_id: payment.id, p_expected_version: payment.version });
  }
  rejectSalePayment(payment: SalePayment, reason: string): Promise<SalePayment> {
    return this.rpc('reject_sale_payment', { p_id: payment.id, p_expected_version: payment.version, p_reason: reason });
  }
  cashOverview(id: string | null = null): Promise<CashSession | null> { return this.rpc('cash_overview', { p_id: id }); }
  cashSessions(page = 1): Promise<Paged<CashSession>> { return this.rpc('search_cash_sessions', { p_page: page, p_size: 10 }); }
  cashMovements(id: string, page = 1): Promise<Paged<CashMovement>> {
    return this.rpc('search_cash_movements', { p_session_id: id, p_page: page, p_size: 10 });
  }
  openCash(opening: string, requestId: string): Promise<CashSession> {
    return this.rpc('open_cash', { p_opening: opening, p_request_id: requestId });
  }
  recordCash(input: CashMovementInput): Promise<CashMovement> { return this.rpc('record_cash_movement', { p_input: input }); }
  closeCash(session: CashSession, counted: string): Promise<CashSession> {
    return this.rpc('close_cash', { p_id: session.id, p_expected_version: session.version, p_counted: counted });
  }
}
