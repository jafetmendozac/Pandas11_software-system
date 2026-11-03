import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ContactCandidate, ContactChannel, ContactKind, ContactQueueService, ContactResult, ConsentSource } from '../../shared/services/contact-queue.service';
import { limaDateTime } from '../../shared/services/work-calendar.service';

@Component({
  standalone: true,
  selector: 'app-contactos',
  imports: [FormsModule, PageBreadcrumbComponent, ComponentCardComponent],
  templateUrl: './contactos.component.html',
})
export class ContactosComponent implements OnDestroy {
  readonly auth = inject(AuthorizationService);
  private readonly service = inject(ContactQueueService);
  readonly rows = signal<ContactCandidate[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly field = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
  readonly button = 'rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800';
  readonly date = limaDateTime;
  search = '';
  kind: ContactKind | '' = '';
  page = 1;
  total = 0;
  today = '';
  selected: ContactCandidate | null = null;
  channel: ContactChannel = 'PHONE';
  result: ContactResult = 'CONTACTED';
  note = '';
  source: ConsentSource = 'VERBAL';
  pendingRequest: string | null = null;
  private revision = 0;

  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { this.revision++; }

  async load(page = 1): Promise<void> {
    const rev = ++this.revision;
    this.page = page;
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await this.service.list(this.kind || null, this.search.trim(), page);
      if (rev !== this.revision) return;
      this.rows.set(data.rows);
      this.total = data.total;
      this.today = data.today;
      if (this.selected) {
        const updated = data.rows.find(row => this.key(row) === this.key(this.selected!));
        if (updated) this.selected = updated;
        else if (!this.pendingRequest) this.selected = null;
      }
    } catch (e) {
      if (rev === this.revision) this.error.set(this.message(e));
    } finally {
      if (rev === this.revision) this.loading.set(false);
    }
  }

  key(row: ContactCandidate): string { return `${row.kind}:${row.appointment_id}`; }
  choose(row: ContactCandidate): void {
    if (this.pendingRequest) { this.error.set('Resuelve primero el resultado del registro pendiente.'); return; }
    this.selected = row;
    this.channel = row.whatsapp_allowed ? 'WHATSAPP' : 'PHONE';
    this.result = 'CONTACTED';
    this.note = '';
    this.source = 'VERBAL';
    this.pendingRequest = null;
    this.error.set(''); this.success.set('');
  }
  kindLabel(kind: ContactKind): string { return kind === 'APPOINTMENT_REMINDER' ? 'Recordatorio de cita' : 'Seguimiento'; }
  message(error: unknown): string { return (error as {message?: string})?.message || 'No se pudo completar la operación.'; }
  whatsappUrl(row: ContactCandidate): string | null {
    const digits = row.whatsapp?.replace(/\D/g, '') ?? '';
    const international = digits.length === 9 && digits.startsWith('9') ? `51${digits}` : digits;
    return row.whatsapp_allowed && international.length >= 10 && international.length <= 15 ? `https://wa.me/${international}` : null;
  }
  async saveAttempt(): Promise<void> {
    const row = this.selected;
    if (!row || this.busy() || !this.auth.hasInSelectedRole('contacts.record')) return;
    if (this.result !== 'SKIPPED' && this.channel === 'WHATSAPP' && !row.whatsapp_allowed) { this.error.set('No hay consentimiento vigente para WhatsApp.'); return; }
    if (this.result !== 'SKIPPED' && this.channel === 'PHONE' && !row.phone?.trim()) { this.error.set('Falta un teléfono para llamar.'); return; }
    if (this.note.length > 500) { this.error.set('La nota admite hasta 500 caracteres.'); return; }
    this.pendingRequest ??= crypto.randomUUID();
    this.busy.set(true); this.error.set(''); this.success.set('');
    try {
      await this.service.record({client: row.client_id, appointment: row.appointment_id, kind: row.kind,
        channel: this.channel, result: this.result, note: this.note, requestId: this.pendingRequest});
      this.pendingRequest = null;
      this.success.set('Intento registrado. La lista se actualizó.');
      await this.load(this.page);
    } catch (e) {
      this.error.set(`${this.message(e)} Reintenta este mismo registro o revisa la lista antes de crear otro.`);
    } finally { this.busy.set(false); }
  }
  async saveConsent(granted: boolean): Promise<void> {
    const row = this.selected;
    if (!row || this.busy() || this.pendingRequest || !this.auth.hasInSelectedRole('contacts.consent')) return;
    this.busy.set(true); this.error.set(''); this.success.set('');
    try {
      await this.service.consent(row.client_id, granted, this.source);
      this.success.set(granted ? 'Consentimiento de WhatsApp registrado.' : 'Consentimiento de WhatsApp revocado.');
      await this.load(this.page);
      const updated = this.rows().find(item => this.key(item) === this.key(row));
      if (updated) this.selected = updated;
    } catch (e) { this.error.set(this.message(e)); }
    finally { this.busy.set(false); }
  }
}
