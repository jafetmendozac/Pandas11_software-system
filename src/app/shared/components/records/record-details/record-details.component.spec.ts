import { TestBed } from '@angular/core/testing';
import { RecordDetailsComponent } from './record-details.component';
import { RecordsService } from '../../../services/records.service';
import { AuthorizationService } from '../../../services/authorization.service';

describe('RecordDetailsComponent: separación de información', () => {
  let records: { vaccinations: jasmine.Spy; note: jasmine.Spy; saveNote: jasmine.Spy };
  let permissions: string[];
  beforeEach(() => {
    permissions = [];
    records = {
      vaccinations: jasmine.createSpy().and.resolveTo([]),
      note: jasmine.createSpy().and.resolveTo({ notes: 'Detalle reservado', updated_by: 'owner', updated_at: '2026-10-17' }),
      saveNote: jasmine.createSpy().and.resolveTo(),
    };
    TestBed.configureTestingModule({ imports: [RecordDetailsComponent], providers: [
      { provide: RecordsService, useValue: records },
      { provide: AuthorizationService, useValue: { has: (permission: string) => permissions.includes(permission) } },
    ] });
  });
  it('cliente consulta vacunas y observaciones sin solicitar notas internas', async () => {
    const fixture = TestBed.createComponent(RecordDetailsComponent);
    fixture.componentRef.setInput('pet', { id: 'pet', name: 'Toby', client_notes: 'Visible', allergies: true });
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(records.vaccinations).toHaveBeenCalledWith('pet');
    expect(records.note).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Visible');
    expect(fixture.nativeElement.textContent).not.toContain('Detalle reservado');
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
  });
  it('personal de consulta ve notas pero no puede editarlas', async () => {
    permissions = ['internal.read'];
    const fixture = TestBed.createComponent(RecordDetailsComponent);
    fixture.componentRef.setInput('client', { id: 'client', first_name: 'María' });
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(records.note).toHaveBeenCalledWith('client', 'client');
    expect(fixture.nativeElement.querySelector('textarea').readOnly).toBeTrue();
    await fixture.componentInstance.saveNotes();
    expect(records.saveNote).not.toHaveBeenCalled();
  });
  it('archivo mantiene solo lectura aunque el usuario tenga permiso de escritura', async () => {
    permissions = ['internal.read', 'internal.manage'];
    const fixture = TestBed.createComponent(RecordDetailsComponent);
    fixture.componentRef.setInput('client', { id: 'client', first_name: 'María' });
    fixture.componentRef.setInput('archived', true);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    await fixture.componentInstance.saveNotes();
    expect(records.saveNote).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('textarea').readOnly).toBeTrue();
  });
});
