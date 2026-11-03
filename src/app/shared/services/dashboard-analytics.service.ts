import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  DashboardAnalytics, DashboardKpis, DashboardProductRank,
  DashboardServiceRank, DashboardTrendPoint,
} from './dashboard-analytics.models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isKpis(value: unknown): value is DashboardKpis {
  return isRecord(value) && typeof value['month'] === 'string'
    && value['timezone'] === 'America/Lima'
    && typeof value['service_collections'] === 'string'
    && typeof value['product_collections'] === 'string'
    && typeof value['total_collections'] === 'string'
    && typeof value['completed_appointments'] === 'number';
}

function isTrendPoint(value: unknown): value is DashboardTrendPoint {
  return isRecord(value) && typeof value['month'] === 'string'
    && typeof value['service_collections'] === 'string'
    && typeof value['product_collections'] === 'string';
}

function isServiceRank(value: unknown): value is DashboardServiceRank {
  return isRecord(value) && typeof value['service_id'] === 'string'
    && typeof value['name'] === 'string' && Number.isSafeInteger(value['quantity'])
    && Number(value['quantity']) >= 0;
}

function isProductRank(value: unknown): value is DashboardProductRank {
  return isRecord(value) && typeof value['product_id'] === 'string'
    && typeof value['name'] === 'string' && Number.isSafeInteger(value['quantity'])
    && Number(value['quantity']) >= 0;
}

function isAnalytics(value: unknown): value is DashboardAnalytics {
  return isRecord(value) && typeof value['month'] === 'string'
    && value['timezone'] === 'America/Lima' && isKpis(value['kpis'])
    && Array.isArray(value['trend']) && value['trend'].length === 12
    && value['trend'].every(isTrendPoint)
    && Array.isArray(value['services']) && value['services'].every(isServiceRank)
    && Array.isArray(value['products']) && value['products'].every(isProductRank);
}

@Injectable({ providedIn: 'root' })
export class DashboardAnalyticsService {
  private readonly supabase = inject(SupabaseService);

  async kpis(month: string): Promise<DashboardKpis> {
    const { data, error } = await this.supabase.client.rpc('dashboard_kpis', { p_month: `${month}-01` });
    if (error) throw error;
    if (!isKpis(data)) throw new Error('Respuesta de indicadores inválida');
    return data;
  }

  async analytics(month: string): Promise<DashboardAnalytics> {
    const { data, error } = await this.supabase.client.rpc('dashboard_analytics', { p_month: `${month}-01` });
    if (error) throw error;
    if (!isAnalytics(data) || data.month !== month || data.kpis.month !== month
      || data.trend[11].month !== month) throw new Error('Respuesta de gráficos inválida');
    return data;
  }
}
