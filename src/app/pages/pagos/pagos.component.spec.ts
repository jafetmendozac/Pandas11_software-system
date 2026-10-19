import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagosComponent } from './pagos.component';
import { PaymentRpcError, PaymentsService } from '../../shared/services/payments.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { Payment, PaymentSummary } from '../../shared/services/payment.models';
describe('Pagos: permisos, modales y recuperación de errores', () => {
  let fixture: ComponentFixture<PagosComponent>; let component: PagosComponent;
  let service: jasmine.SpyObj<PaymentsService>; let granted: Set<string>;
  const summary: PaymentSummary = { appointment_id: 'a', client_name: 'Cliente fixture', status: 'COMPLETED', source: 'INTERNAL', total: '100.35', confirmed: '0', pending: '20.10', outstanding: '100.35', requires_resolution: false };
  const payment: Payment = { id: 'p', appointment_id: 'a', client_id: 'c', client_name: 'Cliente fixture', appointment_status: 'COMPLETED', appointment_starts_at: '2026-10-18T12:00:00Z', type: 'BALANCE', method: 'CASH', status: 'PENDING', amount: '20.10', operation_code: null, external_ref: '<script>fixture</script>', created_by: 'admin', verified_by: null, paid_at: null, created_at: '2026-10-18T12:00:00Z', version: 1, rejection_reason: null };
  beforeEach(async () => {
    granted = new Set(['payments.read', 'payments.create']);
    service = jasmine.createSpyObj<PaymentsService>('PaymentsService', ['search', 'summary', 'candidates', 'register', 'verify', 'reject', 'get']);
    service.search.and.resolveTo({ rows: [payment], total: 1 }); service.summary.and.resolveTo(summary); service.candidates.and.resolveTo({ rows: [], total: 0 }); service.get.and.resolveTo(payment);
    await TestBed.configureTestingModule({ imports: [PagosComponent], providers: [provideRouter([]), { provide: PaymentsService, useValue: service }, { provide: AuthorizationService, useValue: { has: (p: string) => granted.has(p) } }] }).compileComponents();
    fixture = TestBed.createComponent(PagosComponent); component = fixture.componentInstance; fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });
  it('ADMIN consulta evidencia como texto, sin acciones de verificación', async () => {
    await component.openReview(payment); fixture.detectChanges(); await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('<script>fixture</script>'); expect(element.querySelector('script')).toBeNull();
    expect(element.textContent).not.toContain('Confirmar recepción del dinero');
    await component.decide(true); expect(service.verify).not.toHaveBeenCalled();
  });
  it('conserva importe y clave de reintento cuando se pierde la respuesta', async () => {
    component.summary.set(summary); await component.openCreate(); component.amount = '20.10'; service.register.and.rejectWith(new Error('Red interrumpida'));
    await component.register(); const first = service.register.calls.mostRecent().args[0];
    expect(component.modal()).toBe('create'); expect(component.amount).toBe('20.10'); expect(component.formError()).toContain('Red interrumpida');
    await component.register(); expect(service.register.calls.mostRecent().args[0].request_id).toBe(first.request_id);
    component.amount = '21'; await component.register(); expect(service.register).toHaveBeenCalledTimes(2);
  });
  it('OWNER no confirma dos veces mientras espera respuesta', async () => {
    granted.add('payments.verify'); await component.openReview(payment);
    let finish!: (p: Payment) => void; service.verify.and.returnValue(new Promise(resolve => { finish = resolve; }));
    const first = component.decide(true); await component.decide(true); component.close();
    expect(service.verify).toHaveBeenCalledTimes(1); expect(component.modal()).toBe('review');
    finish({ ...payment, status: 'PAID', version: 2 }); await first; expect(component.selected()?.status).toBe('PAID');
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=dialog]')?.contains(document.activeElement)).toBeTrue();
  });
  it('exige motivo de rechazo y permite recargar tras conflicto', async () => {
    granted.add('payments.verify'); await component.openReview(payment); await component.decide(false); expect(service.reject).not.toHaveBeenCalled();
    service.verify.and.rejectWith(new Error('Versión cambió')); await component.decide(true); expect(component.formError()).toContain('Recarga');
    service.get.and.resolveTo({ ...payment, status: 'FAILED', version: 2 }); await component.reloadReview(); expect(component.selected()?.status).toBe('FAILED');
  });
  it('descarta la respuesta de una lista anterior', async () => {
    let finish!: (r: { rows: Payment[]; total: number }) => void;
    service.search.and.returnValue(new Promise(resolve => { finish = resolve; })); const older = component.load();
    service.search.and.resolveTo({ rows: [], total: 0 }); await component.load(); finish({ rows: [payment], total: 1 }); await older;
    expect(component.rows()).toEqual([]); expect(component.total()).toBe(0);
  });
  it('no registra importes inválidos y no cierra el formulario', async () => {
    component.summary.set(summary); await component.openCreate(); component.amount = '0'; await component.register();
    expect(service.register).not.toHaveBeenCalled(); expect(component.modal()).toBe('create'); expect(component.formError()).toContain('mayor que cero');
  });
  it('permite corregir importe cuando SQL rechaza definitivamente el cobro', async () => {
    component.summary.set(summary); await component.openCreate(); component.amount = '120';
    service.register.and.rejectWith(new PaymentRpcError('Supera saldo', '22023'));
    await component.register(); component.amount = '20.10'; service.register.and.resolveTo(payment);
    await component.register(); expect(service.register).toHaveBeenCalledTimes(2); expect(component.modal()).toBeNull();
  });

});
