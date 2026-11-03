import { TestBed } from '@angular/core/testing';
import { DashboardAnalyticsService } from './dashboard-analytics.service';
import { SupabaseService } from './supabase.service';

describe('DashboardAnalyticsService', () => {
  const kpis = {
    month: '2026-10', timezone: 'America/Lima', service_collections: '10.20',
    product_collections: '5.05', total_collections: '15.25', completed_appointments: 2,
  };
  let rpc: jasmine.Spy;
  let service: DashboardAnalyticsService;

  beforeEach(() => {
    rpc = jasmine.createSpy('rpc');
    TestBed.configureTestingModule({ providers: [
      { provide: SupabaseService, useValue: { client: { rpc } } },
    ] });
    service = TestBed.inject(DashboardAnalyticsService);
  });

  it('envía el primer día del mes y conserva importes como texto', async () => {
    rpc.and.resolveTo({ data: {
      month: '2026-10', timezone: 'America/Lima', kpis,
      trend: Array.from({ length: 12 }, () => ({
        month: '2026-10', service_collections: '10.20', product_collections: '5.05',
      })),
      services: [], products: [],
    }, error: null });

    const result = await service.analytics('2026-10');
    expect(rpc).toHaveBeenCalledOnceWith('dashboard_analytics', { p_month: '2026-10-01' });
    expect(result.kpis.total_collections).toBe('15.25');
  });

  it('rechaza respuestas incompletas para no pintar cifras incorrectas', async () => {
    rpc.and.resolveTo({ data: { month: '2026-10', kpis, trend: [], services: [], products: [] }, error: null });
    await expectAsync(service.analytics('2026-10')).toBeRejectedWithError('Respuesta de gráficos inválida');
  });

  it('consulta la RPC 5.1 con el mismo periodo', async () => {
    rpc.and.resolveTo({ data: kpis, error: null });
    const result = await service.kpis('2026-10');
    expect(rpc).toHaveBeenCalledOnceWith('dashboard_kpis', { p_month: '2026-10-01' });
    expect(result.total_collections).toBe('15.25');
  });
});
