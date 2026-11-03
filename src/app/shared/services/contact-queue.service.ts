import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ContactKind = 'APPOINTMENT_REMINDER' | 'FOLLOW_UP';
export type ContactChannel = 'WHATSAPP' | 'PHONE';
export type ContactResult = 'CONTACTED' | 'NO_ANSWER' | 'SKIPPED';
export type ConsentSource = 'VERBAL' | 'WRITTEN';

export interface ContactCandidate {
  client_id: string;
  appointment_id: string;
  kind: ContactKind;
  due_at: string;
  client_name: string;
  pet_names: string;
  phone: string | null;
  whatsapp: string | null;
  whatsapp_allowed: boolean;
  attempted: boolean;
}
export interface ContactPage {
  rows: ContactCandidate[];
  total: number;
  today: string;
}
export interface ContactAttemptInput {
  client: string;
  appointment: string;
  kind: ContactKind;
  channel: ContactChannel;
  result: ContactResult;
  note: string;
  requestId: string;
}

@Injectable({ providedIn: 'root' })
export class ContactQueueService {
  private readonly supabase = inject(SupabaseService);

  async list(kind: ContactKind | null, search: string, page: number): Promise<ContactPage> {
    const { data, error } = await this.supabase.client.rpc('contact_queue', {
      p_kind: kind, p_search: search, p_page: page, p_size: 10,
    });
    if (error) throw error;
    if (!data || !Array.isArray(data.rows) || typeof data.total !== 'number' || typeof data.today !== 'string') {
      throw new Error('Respuesta inválida de la lista de contactos.');
    }
    return data as ContactPage;
  }

  async record(input: ContactAttemptInput): Promise<void> {
    const { error } = await this.supabase.client.rpc('record_contact_attempt', {
      p_client: input.client, p_kind: input.kind, p_appointment: input.appointment,
      p_channel: input.channel, p_result: input.result, p_note: input.note,
      p_request: input.requestId,
    });
    if (error) throw error;
  }

  async consent(client: string, granted: boolean, source: ConsentSource): Promise<void> {
    const { error } = await this.supabase.client.rpc('record_contact_consent', {
      p_client: client, p_granted: granted, p_source: source,
    });
    if (error) throw error;
  }
}
