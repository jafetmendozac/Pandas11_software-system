import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AppointmentRecord {
  id: string;
  client_id: string;
  pet_id: string;
  employee_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
}

export interface AppointmentServiceInput {
  service_id: string;
  price: number;
  duration_minutes: number;
}

export interface AppointmentServiceRecord {
  id: string;
  appointment_id: string;
  service_id: string;
  price: number;
  duration_minutes: number;
  service?: {
    id: string;
    name: string | null;
  } | Array<{
    id: string;
    name: string | null;
  }> | null;
}

export interface AppointmentWithRelations extends AppointmentRecord {
  client?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
  }> | null;
  pet?: {
    id: string;
    name: string | null;
  } | Array<{
    id: string;
    name: string | null;
  }> | null;
  employee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
  }> | null;
  appointment_services?: AppointmentServiceRecord[];
}

export interface ClientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface PetOption {
  id: string;
  client_id: string | null;
  name: string | null;
}

export interface EmployeeOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface ServiceOption {
  id: string;
  name: string | null;
  price: number | null;
  duration_minutes: number | null;
  active: boolean | null;
}

export interface AppointmentInput {
  client_id: string;
  pet_id: string;
  employee_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string;
  services: AppointmentServiceInput[];
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<AppointmentWithRelations[]> {
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select(`
        id,
        client_id,
        pet_id,
        employee_id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        client:clients(id, first_name, last_name),
        pet:pets(id, name),
        employee:profiles(id, first_name, last_name),
        appointment_services(
          id,
          appointment_id,
          service_id,
          price,
          duration_minutes,
          service:services(id, name)
        )
      `)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as AppointmentWithRelations[];
  }

  async create(input: AppointmentInput): Promise<AppointmentRecord> {
    const { services, ...appointmentPayload } = input;
    const { data, error } = await this.supabase.client
      .from('appointments')
      .insert({
        ...appointmentPayload,
        status: input.status ?? 'scheduled',
        notes: input.notes ?? null,
      })
      .select('id, client_id, pet_id, employee_id, appointment_date, start_time, end_time, status, notes')
      .single();

    if (error) throw error;

    if (services.length > 0) {
      const { error: servicesError } = await this.supabase.client
        .from('appointment_services')
        .insert(
          services.map((service) => ({
            appointment_id: data.id,
            service_id: service.service_id,
            price: service.price,
            duration_minutes: service.duration_minutes,
          })),
        );

      if (servicesError) throw servicesError;
    }

    return data as AppointmentRecord;
  }

  async update(id: string, input: AppointmentInput): Promise<AppointmentRecord> {
    const { services, ...appointmentPayload } = input;
    const { data, error } = await this.supabase.client
      .from('appointments')
      .update({
        ...appointmentPayload,
        status: input.status ?? 'scheduled',
        notes: input.notes ?? null,
      })
      .eq('id', id)
      .select('id, client_id, pet_id, employee_id, appointment_date, start_time, end_time, status, notes')
      .single();

    if (error) throw error;

    const { error: clearError } = await this.supabase.client
      .from('appointment_services')
      .delete()
      .eq('appointment_id', id);

    if (clearError) throw clearError;

    if (services.length > 0) {
      const { error: servicesError } = await this.supabase.client
        .from('appointment_services')
        .insert(
          services.map((service) => ({
            appointment_id: id,
            service_id: service.service_id,
            price: service.price,
            duration_minutes: service.duration_minutes,
          })),
        );

      if (servicesError) throw servicesError;
    }

    return data as AppointmentRecord;
  }

  async remove(id: string): Promise<void> {
    const { error: servicesError } = await this.supabase.client
      .from('appointment_services')
      .delete()
      .eq('appointment_id', id);

    if (servicesError) throw servicesError;

    const { error } = await this.supabase.client
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getClients(): Promise<ClientOption[]> {
    const { data, error } = await this.supabase.client
      .from('clients')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ClientOption[];
  }

  async getPets(): Promise<PetOption[]> {
    const { data, error } = await this.supabase.client
      .from('pets')
      .select('id, client_id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as PetOption[];
  }

  async getEmployees(): Promise<EmployeeOption[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('active', true)
      .order('first_name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as EmployeeOption[];
  }

  async getServices(): Promise<ServiceOption[]> {
    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, price, duration_minutes, active')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ServiceOption[];
  }
}
