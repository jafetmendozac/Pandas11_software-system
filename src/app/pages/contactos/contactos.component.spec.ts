import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ContactCandidate, ContactQueueService } from '../../shared/services/contact-queue.service';
import { ContactosComponent } from './contactos.component';

const row: ContactCandidate = {
  client_id: 'client-1', appointment_id: 'appointment-1', kind: 'APPOINTMENT_REMINDER',
  due_at: '2026-10-30T15:00:00Z', client_name: 'María Pérez', pet_names: 'Max',
  phone: '999888777', whatsapp: '999888777', whatsapp_allowed: false, attempted: false,
};

describe('Lista por contactar', () => {
  let list: jasmine.Spy;
  let record: jasmine.Spy;
  let consent: jasmine.Spy;
  let permissions: string[];

  beforeEach(() => {
    permissions = ['contacts.read', 'contacts.record'];
    list = jasmine.createSpy('list').and.resolveTo({ rows: [{ ...row }], total: 1, today: '2026-10-29' });
    record = jasmine.createSpy('record').and.resolveTo(undefined);
    consent = jasmine.createSpy('consent').and.resolveTo(undefined);
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: AuthorizationService, useValue: {
        has: (code: string) => permissions.includes(code),
        hasInSelectedRole: (code: string) => permissions.includes(code),
      } },
      { provide: ContactQueueService, useValue: { list, record, consent } },
    ] });
  });

  it('muestra candidatos reales y no ofrece WhatsApp sin consentimiento verificable', async () => {
    const fixture = TestBed.createComponent(ContactosComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(list).toHaveBeenCalledOnceWith(null, '', 1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('María Pérez');
    component.choose(row); fixture.detectChanges();
    expect(component.whatsappUrl(row)).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href^="https://wa.me/"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Registrar consentimiento');
  });

  it('reintenta una respuesta incierta con el mismo identificador', async () => {
    const fixture = TestBed.createComponent(ContactosComponent);
    fixture.detectChanges(); await fixture.whenStable();
    const component = fixture.componentInstance;
    component.choose(row);
    component.channel = 'PHONE';
    record.and.returnValues(Promise.reject(new Error('Sin conexión')), Promise.resolve(undefined));
    await component.saveAttempt();
    const first = record.calls.first().args[0].requestId;
    expect(component.pendingRequest).toBe(first);
    await component.saveAttempt();
    expect(record.calls.mostRecent().args[0].requestId).toBe(first);
    expect(component.pendingRequest).toBeNull();
  });

  it('forma un enlace peruano solo cuando WhatsApp está autorizado', async () => {
    const fixture = TestBed.createComponent(ContactosComponent);
    fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.componentInstance.whatsappUrl({ ...row, whatsapp_allowed: true })).toBe('https://wa.me/51999888777');
  });
});
