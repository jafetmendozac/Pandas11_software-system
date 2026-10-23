import { Component, DestroyRef, ElementRef, Injector, OnDestroy, OnInit, ViewChild, afterNextRender, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { PaymentRpcError, PaymentsService } from '../../shared/services/payments.service';
import { Payment, PaymentCandidate, PaymentInput, PaymentMethod, PaymentQuery, PaymentSummary, PAYMENT_METHODS, PAYMENT_STATUSES, paymentAmount, paymentReference } from '../../shared/services/payment.models';
import { decimalLabel } from '../../shared/services/service-pricing.models';
import { limaDateTime } from '../../shared/services/work-calendar.service';
import { STATUS_LABELS } from '../../shared/services/appointment.models';
@Component({ selector: 'app-pagos', standalone: true, imports: [FormsModule, RouterLink, A11yModule, PageBreadcrumbComponent, ComponentCardComponent, ModalComponent], templateUrl: './pagos.component.html' })
export class PagosComponent implements OnInit, OnDestroy {
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;
  private readonly injector = inject(Injector);
  readonly authorization = inject(AuthorizationService);
  private readonly payments = inject(PaymentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly rows = signal<Payment[]>([]); readonly total = signal(0); readonly loading = signal(false); readonly error = signal('');
  readonly summary = signal<PaymentSummary | null>(null); readonly modal = signal<'create' | 'review' | null>(null);
  readonly selected = signal<Payment | null>(null); readonly modalSummary = signal<PaymentSummary | null>(null);
  readonly busy = signal(false); readonly formError = signal(''); readonly detailLoading = signal(false);
  readonly candidates = signal<PaymentCandidate[]>([]); readonly candidateTotal = signal(0); readonly candidateLoading = signal(false);
  readonly methods = Object.entries(PAYMENT_METHODS) as [PaymentMethod, string][];
  readonly methodLabels = PAYMENT_METHODS; readonly statusLabels = PAYMENT_STATUSES; readonly appointmentLabels = STATUS_LABELS;
  readonly money = decimalLabel; readonly date = limaDateTime;
  readonly inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';
  readonly buttonClass = 'rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800';
  query: PaymentQuery = { search: '', appointmentId: '', status: '', method: '', from: '', until: '', page: 1, size: 10 };
  candidateSearch = ''; candidatePage = 1; amount = ''; method: PaymentMethod = 'CASH'; operation = ''; reference = ''; reason = '';
  private requestId = ''; private submitted: PaymentInput | null = null;
  private revision = 0; private modalRevision = 0; private candidateRevision = 0;
  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.query = { ...this.query, appointmentId: params.get('cita') || '', page: 1 };
      void this.load();
    });
  }
  ngOnDestroy(): void { this.revision++; this.modalRevision++; this.candidateRevision++; }
  async load(page = 1): Promise<void> {
    this.query.page = page; const revision = ++this.revision;
    const q = { ...this.query }; this.loading.set(true); this.error.set(''); this.summary.set(null);
    try {
      const [result, summary] = await Promise.all([this.payments.search(q), q.appointmentId ? this.payments.summary(q.appointmentId) : Promise.resolve(null)]);
      if (revision !== this.revision) return;
      this.rows.set(result.rows); this.total.set(result.total); this.summary.set(summary);
    } catch (error) { if (revision === this.revision) { this.rows.set([]); this.total.set(0); this.error.set(this.message(error)); } }
    finally { if (revision === this.revision) this.loading.set(false); }
  }
  async openCreate(): Promise<void> {
    if (this.busy() || !this.authorization.has('payments.create')) return;
    this.modalRevision++; this.candidateRevision++; this.submitted = null; this.requestId = crypto.randomUUID();
    this.amount = ''; this.method = 'CASH'; this.operation = ''; this.reference = ''; this.candidateSearch = ''; this.candidatePage = 1;
    this.formError.set(''); this.selected.set(null); this.modalSummary.set(null); this.modal.set('create'); this.detailLoading.set(false);
    if (this.summary()?.status === 'COMPLETED') await this.choose(this.summary()!.appointment_id);
    else await this.loadCandidates();
  }
  async loadCandidates(page = 1): Promise<void> {
    this.candidatePage = page; const revision = ++this.candidateRevision; this.candidateLoading.set(true); this.formError.set('');
    try { const r = await this.payments.candidates(this.candidateSearch, page); if (revision === this.candidateRevision) { this.candidates.set(r.rows); this.candidateTotal.set(r.total); } }
    catch (error) { if (revision === this.candidateRevision) { this.candidates.set([]); this.formError.set(this.message(error)); } }
    finally { if (revision === this.candidateRevision) this.candidateLoading.set(false); }
  }
  async choose(id: string): Promise<void> {
    if (this.busy()) return;
    const revision = ++this.modalRevision; this.detailLoading.set(true); this.formError.set(''); this.modalSummary.set(null);
    try { const s = await this.payments.summary(id); if (revision === this.modalRevision) this.modalSummary.set(s); }
    catch (error) { if (revision === this.modalRevision) this.formError.set(this.message(error)); }
    finally { if (revision === this.modalRevision) this.detailLoading.set(false); }
  }
  async openReview(p: Payment): Promise<void> {
    if (this.busy()) return;
    this.modalRevision++; this.formError.set(''); this.reason = ''; this.selected.set(p); this.modalSummary.set(null); this.modal.set('review');
    await this.choose(p.appointment_id);
  }
  close(): void { if (!this.busy()) { this.modal.set(null); this.modalRevision++; this.candidateRevision++; } }
  async register(): Promise<void> {
    if (this.busy() || this.detailLoading() || !this.authorization.has('payments.create')) return;
    const summary = this.modalSummary(); if (!summary) return;
    this.formError.set('');
    try {
      const input: PaymentInput = { appointment_id: summary.appointment_id, type: 'BALANCE', method: this.method,
        amount: paymentAmount(this.amount), operation_code: paymentReference(this.operation), external_ref: paymentReference(this.reference), request_id: this.requestId };
      // Respuesta perdida: preservar la misma clave para el mismo contenido; no duplicar al reintentar.
      if (this.submitted && JSON.stringify(input) !== JSON.stringify(this.submitted)) throw new Error('Hay un envío sin confirmar. Reintenta con los mismos datos o consulta los pagos de la cita antes de cambiar el cobro.');
      this.submitted = input; this.busy.set(true);
      await this.payments.register(input); this.modal.set(null); this.modalRevision++; await this.load(this.query.page);
    } catch (error) {
      // Error PostgreSQL explícito: la transacción no se confirmó y se puede corregir el formulario.
      if (error instanceof PaymentRpcError && /^[0-9]{5}$/.test(error.code)) this.submitted = null;
      this.formError.set(this.message(error));
    }
    finally { this.busy.set(false); }
  }
  async decide(verify: boolean): Promise<void> {
    const p = this.selected(); if (!p || this.busy() || this.detailLoading() || !this.authorization.has('payments.verify')) return;
    this.formError.set('');
    if (!verify && (!this.reason.trim() || this.reason.trim().length > 500)) { this.formError.set('Indica un motivo de rechazo de hasta 500 caracteres.'); return; }
    this.busy.set(true);
    try { const updated = await (verify ? this.payments.verify(p) : this.payments.reject(p, this.reason.trim())); this.selected.set(updated); this.modalSummary.set(await this.payments.summary(p.appointment_id)); await this.load(this.query.page); }
    catch (error) { this.formError.set(`${this.message(error)} Recarga la ficha antes de volver a decidir.`); }
    finally {
      this.busy.set(false);
      // La acción verificada desaparece: devolver el foco a un control que sigue en el modal.
      afterNextRender(() => { if (this.modal() === 'review') this.closeButton?.nativeElement.focus(); }, { injector: this.injector });
    }
  }
  async reloadReview(): Promise<void> {
    const p = this.selected(); if (!p || this.busy()) return;
    const revision = ++this.modalRevision; this.detailLoading.set(true); this.formError.set('');
    try {
      const [fresh, summary] = await Promise.all([this.payments.get(p.id), this.payments.summary(p.appointment_id)]);
      if (revision === this.modalRevision) { this.selected.set(fresh); this.modalSummary.set(summary); }
    } catch (error) { if (revision === this.modalRevision) this.formError.set(this.message(error)); }
    finally { if (revision === this.modalRevision) this.detailLoading.set(false); }
  }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'No se pudo completar la operación.'; }
}
