import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.models';
describe('PaymentsService', () => {
  let rpc: jasmine.Spy; let service: PaymentsService;
  beforeEach(() => {
    rpc = jasmine.createSpy().and.resolveTo({ data: { rows: [], total: 0 }, error: null });
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: { client: { rpc } } }] });
    service = TestBed.inject(PaymentsService);
  });
  it('envía filtros y fechas al servidor sin calcular saldos en cliente', async () => {
    await service.search({ search: 'Ana', appointmentId: 'a', status: 'PENDING', method: 'CASH', from: '2026-10-01', until: '2026-10-18', page: 2, size: 10 });
    expect(rpc).toHaveBeenCalledWith('search_payments', jasmine.objectContaining({ p_search: 'Ana', p_appointment_id: 'a', p_page: 2, p_from: '2026-10-01', p_status: 'PENDING' }));
  });
  it('no reintenta una decisión fallida y conserva versión esperada', async () => {
    rpc.and.resolveTo({ error: { message: 'Saldo cambiado' } });
    await expectAsync(service.verify({ id: 'p', version: 2 } as Payment)).toBeRejectedWithError('Saldo cambiado');
    expect(rpc).toHaveBeenCalledOnceWith('verify_payment', { p_id: 'p', p_expected_version: 2 });
  });
});
