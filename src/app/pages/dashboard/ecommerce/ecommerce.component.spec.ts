import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { AuthorizationService, UserRoleContext } from '../../../shared/services/authorization.service';
import { DashboardAnalyticsService } from '../../../shared/services/dashboard-analytics.service';
import { DashboardAnalytics, limaMonth } from '../../../shared/services/dashboard-analytics.models';
import { EcommerceComponent } from './ecommerce.component';

@Component({ selector: 'apx-chart', standalone: true, template: '' })
class FakeChartComponent {
  @Input() series: unknown;
  @Input() chart: unknown;
  @Input() xaxis: unknown;
  @Input() plotOptions: unknown;
  @Input() dataLabels: unknown;
  @Input() legend: unknown;
  @Input() tooltip: unknown;
  @Input() colors: unknown;
}

const ownerRole: UserRoleContext = {
  role_id: 'owner', code: 'OWNER', name: 'Propietario', permissions: ['panel.access', 'analytics.read'],
};
const staffRole: UserRoleContext = {
  role_id: 'staff', code: 'STAFF', name: 'Personal', permissions: ['panel.access', 'appointments.read'],
};

function report(): DashboardAnalytics {
  const month = limaMonth(new Date());
  return {
    month, timezone: 'America/Lima',
    kpis: { month, timezone: 'America/Lima', service_collections: '12.50',
      product_collections: '8.30', total_collections: '20.80', completed_appointments: 2 },
    trend: [{ month, service_collections: '12.50', product_collections: '8.30' }],
    services: [{ service_id: 'service-1', name: 'Baño', quantity: 2 }],
    products: [{ product_id: 'product-1', name: 'Champú', quantity: 3 }],
  };
}

describe('Dashboard de analítica', () => {
  let selectedRole: ReturnType<typeof signal<UserRoleContext | null>>;
  let analytics: jasmine.Spy<(month: string) => Promise<DashboardAnalytics>>;

  beforeEach(() => {
    selectedRole = signal<UserRoleContext | null>(ownerRole);
    analytics = jasmine.createSpy('analytics').and.resolveTo(report());
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: AuthorizationService, useValue: { selectedRole } },
      { provide: DashboardAnalyticsService, useValue: { analytics } },
    ] });
    TestBed.overrideComponent(EcommerceComponent, { set: { imports: [RouterLink, FakeChartComponent] } });
  });

  async function mount(): Promise<ComponentFixture<EcommerceComponent>> {
    const fixture = TestBed.createComponent(EcommerceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra datos reales separados y ningún dato de plantilla a OWNER', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(analytics).toHaveBeenCalledOnceWith(limaMonth(new Date()));
    expect(text).toContain('S/ 20.80');
    expect(text).toContain('Baño');
    expect(text).toContain('Champú');
    expect(text).not.toContain('Customers');
    expect(text).not.toContain('Monthly Target');
    expect(fixture.componentInstance.trendSeries()[0].data).toEqual([12.5]);
    expect(fixture.componentInstance.trendSeries()[1].data).toEqual([8.3]);
  });

  it('conserva acceso operativo a STAFF sin llamar a la RPC financiera', async () => {
    selectedRole.set(staffRole);
    const fixture = await mount();
    const root = fixture.nativeElement as HTMLElement;
    expect(analytics).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Accesos de trabajo');
    expect(root.querySelector('a[href="/calendario"]')).not.toBeNull();
    expect(root.textContent).not.toContain('S/ 20.80');
    expect(root.querySelector('#dashboard-month')).toBeNull();
  });

  it('permite reintentar un error de carga', async () => {
    analytics.and.returnValues(Promise.reject(new Error('sin conexión')), Promise.resolve(report()));
    const fixture = await mount();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('No pudimos cargar los indicadores');
    root.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(analytics).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('S/ 20.80');
  });

  it('descarta una respuesta si el usuario cambia a STAFF', async () => {
    let resolve!: (value: DashboardAnalytics) => void;
    analytics.and.returnValue(new Promise<DashboardAnalytics>(done => { resolve = done; }));
    const fixture = TestBed.createComponent(EcommerceComponent);
    fixture.detectChanges();
    expect(analytics).toHaveBeenCalledTimes(1);
    selectedRole.set(staffRole);
    fixture.detectChanges();
    resolve(report());
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Accesos de trabajo');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('S/ 20.80');
  });

  it('cambia el mes y muestra un estado vacío', async () => {
    const empty: DashboardAnalytics = {
      ...report(), month: '2025-01',
      kpis: { month: '2025-01', timezone: 'America/Lima', service_collections: '0.00',
        product_collections: '0.00', total_collections: '0.00', completed_appointments: 0 },
      trend: [{ month: '2025-01', service_collections: '0.00', product_collections: '0.00' }],
      services: [], products: [],
    };
    analytics.and.returnValues(Promise.resolve(report()), Promise.resolve(empty));
    const fixture = await mount();
    const monthInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#dashboard-month')!;
    monthInput.value = '2025-01';
    monthInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(analytics).toHaveBeenCalledWith('2025-01');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay actividad registrada');
  });
});
