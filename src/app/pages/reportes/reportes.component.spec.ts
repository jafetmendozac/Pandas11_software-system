import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReportesComponent } from './reportes.component';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { MonthlyReportsService } from '../../shared/services/monthly-reports.service';
import { MonthlyReports } from '../../shared/services/monthly-reports.models';

describe('Reportes sin actividad', () => {
  const role = signal<{ code: string; permissions: string[] } | null>({ code: 'OWNER', permissions: ['analytics.read'] });
  const data: MonthlyReports = {
    timezone: 'America/Lima', from: '', to: '', rows: [],
  };
  let get: jasmine.Spy;

  beforeEach(() => {
    role.set({ code: 'OWNER', permissions: ['analytics.read'] });
    get = jasmine.createSpy('get').and.callFake(async (from: string, to: string) => ({
      ...data, from, to,
      rows: [{ month: to, service_collections: '0.00', product_collections: '0.00',
        total_collections: '0.00', completed_appointments: 0, previous_clients: 0,
        returning_clients: 0, retention_rate: null }],
    }));
    TestBed.configureTestingModule({
      imports: [ReportesComponent],
      providers: [
        { provide: AuthorizationService, useValue: { selectedRole: role } },
        { provide: MonthlyReportsService, useValue: { get } },
      ],
    });
  });

  it('explica el intervalo vacío y conserva las descargas', async () => {
    const fixture = TestBed.createComponent(ReportesComponent);
    fixture.componentInstance.fromMonth.set(fixture.componentInstance.currentMonth);
    fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No hay cobros confirmados ni citas completadas');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button').length).toBeGreaterThan(2);
  });

  it('retira los reportes al cambiar a un rol sin permiso', async () => {
    const fixture = TestBed.createComponent(ReportesComponent);
    fixture.componentInstance.fromMonth.set(fixture.componentInstance.currentMonth);
    fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges();
    role.set({ code: 'STAFF', permissions: [] }); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no tiene acceso a reportes');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button').length).toBe(0);
  });
});
