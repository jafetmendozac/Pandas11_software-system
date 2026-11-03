import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexLegend, ApexPlotOptions,
  ApexTooltip, ApexXAxis, NgApexchartsModule,
} from 'ng-apexcharts';
import { AuthorizationService } from '../../../shared/services/authorization.service';
import { DashboardAnalyticsService } from '../../../shared/services/dashboard-analytics.service';
import { DashboardAnalytics, limaMonth, penAmount, trendLabel } from '../../../shared/services/dashboard-analytics.models';

interface PanelLink {
  label: string;
  path: string;
  permission: string;
  description: string;
}

const PANEL_LINKS: PanelLink[] = [
  { label: 'Agenda', path: '/calendario', permission: 'appointments.read', description: 'Consultar las citas y su estado.' },
  { label: 'Clientes', path: '/clientes', permission: 'clients.read', description: 'Consultar las fichas de clientes.' },
  { label: 'Mascotas', path: '/mascotas', permission: 'pets.read', description: 'Consultar las fichas de mascotas.' },
  { label: 'Servicios', path: '/servicios', permission: 'services.read', description: 'Consultar el catálogo de servicios.' },
];

@Component({
  selector: 'app-ecommerce',
  imports: [RouterLink, NgApexchartsModule],
  templateUrl: './ecommerce.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcommerceComponent {
  private readonly authorization = inject(AuthorizationService);
  private readonly analyticsService = inject(DashboardAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private requestId = 0;

  readonly maxMonth = limaMonth(new Date());
  readonly selectedMonth = signal(this.maxMonth);
  readonly report = signal<DashboardAnalytics | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly canViewAnalytics = computed(() => {
    const role = this.authorization.selectedRole();
    return !!role && (role.code === 'OWNER' || role.code === 'ADMIN')
      && role.permissions.includes('analytics.read');
  });
  readonly operationalLinks = computed(() => {
    const permissions = this.authorization.selectedRole()?.permissions ?? [];
    return PANEL_LINKS.filter(link => permissions.includes(link.permission));
  });
  readonly cards = computed(() => {
    const kpis = this.report()?.kpis;
    return kpis ? [
      { label: 'Total cobrado', value: penAmount(kpis.total_collections), note: 'Cobros confirmados de servicios y productos' },
      { label: 'Cobros de servicios', value: penAmount(kpis.service_collections), note: 'Pagos de citas verificados' },
      { label: 'Cobros de productos', value: penAmount(kpis.product_collections), note: 'Pagos de productos verificados' },
      { label: 'Citas completadas', value: String(kpis.completed_appointments), note: 'Por inicio programado en el mes' },
    ] : [];
  });
  readonly monthIsEmpty = computed(() => {
    const report = this.report();
    return !!report && report.kpis.total_collections === '0.00'
      && report.kpis.completed_appointments === 0
      && report.services.length === 0 && report.products.length === 0;
  });
  readonly trendHasCollections = computed(() =>
    this.report()?.trend.some(point => Number(point.service_collections) > 0 || Number(point.product_collections) > 0) ?? false);
  readonly trendSeries = computed<ApexAxisChartSeries>(() => {
    const points = this.report()?.trend ?? [];
    return [
      { name: 'Servicios', data: points.map(point => Number(point.service_collections)) },
      { name: 'Productos', data: points.map(point => Number(point.product_collections)) },
    ];
  });
  readonly trendXAxis = computed<ApexXAxis>(() => ({
    categories: (this.report()?.trend ?? []).map(point => trendLabel(point.month)),
    axisBorder: { show: false }, axisTicks: { show: false },
  }));
  readonly servicesSeries = computed<ApexAxisChartSeries>(() => [
    { name: 'Servicios realizados', data: (this.report()?.services ?? []).map(item => item.quantity) },
  ]);
  readonly servicesXAxis = computed<ApexXAxis>(() => ({
    categories: (this.report()?.services ?? []).map(item => item.name),
  }));
  readonly productsSeries = computed<ApexAxisChartSeries>(() => [
    { name: 'Unidades vendidas', data: (this.report()?.products ?? []).map(item => item.quantity) },
  ]);
  readonly productsXAxis = computed<ApexXAxis>(() => ({
    categories: (this.report()?.products ?? []).map(item => item.name),
  }));

  readonly trendChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' };
  readonly rankChart: ApexChart = { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' };
  readonly trendPlot: ApexPlotOptions = { bar: { columnWidth: '55%', borderRadius: 4 } };
  readonly rankPlot: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 4 } };
  readonly dataLabels: ApexDataLabels = { enabled: false };
  readonly legend: ApexLegend = { show: true, position: 'top' };
  readonly trendTooltip: ApexTooltip = { y: { formatter: value => penAmount(value.toFixed(2)) } };
  readonly serviceTooltip: ApexTooltip = { y: { formatter: value => `${value} servicios` } };
  readonly productTooltip: ApexTooltip = { y: { formatter: value => `${value} unidades` } };
  readonly trendColors = ['var(--color-brand-500)', 'var(--color-blue-light-500)'];
  readonly serviceColors = ['var(--color-brand-500)'];
  readonly productColors = ['var(--color-blue-light-500)'];

  constructor() {
    effect(() => {
      const allowed = this.canViewAnalytics();
      const month = this.selectedMonth();
      if (allowed) void this.load(month);
      else {
        this.requestId++;
        this.report.set(null);
        this.loading.set(false);
        this.error.set(false);
      }
    });
    this.destroyRef.onDestroy(() => { this.requestId++; });
  }

  setMonth(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value <= this.maxMonth) {
      this.selectedMonth.set(value);
    } else input.value = this.selectedMonth();
  }

  retry(): void {
    if (this.canViewAnalytics()) void this.load(this.selectedMonth());
  }

  money(value: string): string { return penAmount(value); }
  monthLabel(value: string): string { return trendLabel(value); }

  private async load(month: string): Promise<void> {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set(false);
    this.report.set(null);
    try {
      const result = await this.analyticsService.analytics(month);
      if (requestId === this.requestId && this.canViewAnalytics() && month === this.selectedMonth()) {
        this.report.set(result);
      }
    } catch {
      if (requestId === this.requestId && this.canViewAnalytics()) this.error.set(true);
    } finally {
      if (requestId === this.requestId) this.loading.set(false);
    }
  }
}
