import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AppointmentServiceSelection {
  service_id: string;
  price: number;
  duration_minutes: number;
}

export interface AppointmentRecord {
  id?: string;
  client_id: string;
  pet_id: string;
  employee_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  appointment_services?: AppointmentServiceSelection[];
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<AppointmentRecord[]> {
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select('*, appointment_services(*)')
      .order('appointment_date')
      .order('start_time');
    if (error) throw error;
    return (data ?? []) as AppointmentRecord[];
  }

  async create(appointment: AppointmentRecord): Promise<AppointmentRecord> {
    const { appointment_services, ...record } = appointment;
    const { data, error } = await this.supabase.client
      .from('appointments')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    await this.replaceServices(data.id, appointment_services ?? []);
    return data as AppointmentRecord;
  }

  async update(id: string, appointment: Partial<AppointmentRecord>): Promise<void> {
    const { appointment_services, ...record } = appointment;
    const { error } = await this.supabase.client.from('appointments').update(record).eq('id', id);
    if (error) throw error;
    if (appointment_services) await this.replaceServices(id, appointment_services);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('appointments').delete().eq('id', id);
    if (error) throw error;
  }

  private async replaceServices(
    appointmentId: string,
    services: AppointmentServiceSelection[],
  ): Promise<void> {
    const { error: deleteError } = await this.supabase.client
      .from('appointment_services')
      .delete()
      .eq('appointment_id', appointmentId);
    if (deleteError) throw deleteError;
    if (services.length === 0) return;
    const { error: insertError } = await this.supabase.client.from('appointment_services').insert(
      services.map((service) => ({ ...service, appointment_id: appointmentId })),
    );
    if (insertError) throw insertError;
  }
}
