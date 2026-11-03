export interface DashboardKpis {
  month: string;
  timezone: 'America/Lima';
  service_collections: string;
  product_collections: string;
  total_collections: string;
  completed_appointments: number;
}

export interface DashboardTrendPoint {
  month: string;
  service_collections: string;
  product_collections: string;
}

export interface DashboardServiceRank {
  service_id: string;
  name: string;
  quantity: number;
}

export interface DashboardProductRank {
  product_id: string;
  name: string;
  quantity: number;
}

export interface DashboardAnalytics {
  month: string;
  timezone: 'America/Lima';
  kpis: DashboardKpis;
  trend: DashboardTrendPoint[];
  services: DashboardServiceRank[];
  products: DashboardProductRank[];
}

export function limaMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  if (!year || !month) throw new Error('No se pudo determinar el mes local');
  return `${year}-${month}`;
}

export function penAmount(value: string): string {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return 'S/ —';
  const integer = match[1].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `S/ ${integer}.${(match[2] ?? '').padEnd(2, '0')}`;
}

export function trendLabel(month: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return month;
  const [year, number] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', {
    month: 'short', year: '2-digit', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, number - 1, 1)));
}
