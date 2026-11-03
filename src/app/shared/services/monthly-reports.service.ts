import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MonthlyReports, parseMonthlyReports } from './monthly-reports.models';

@Injectable({ providedIn: 'root' })
export class MonthlyReportsService {
  private readonly supabase = inject(SupabaseService);

  async get(from: string, to: string): Promise<MonthlyReports> {
    const { data, error } = await this.supabase.client.rpc('monthly_business_reports', {
      p_from: `${from}-01`, p_to: `${to}-01`,
    });
    if (error) throw error;
    return parseMonthlyReports(data, from, to);
  }
}
