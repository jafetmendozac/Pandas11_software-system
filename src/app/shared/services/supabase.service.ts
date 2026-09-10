import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Ejemplo de un método para autenticación
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  }

  // Ejemplo de un método para obtener datos
  async getClients() {
    const { data, error } = await this.supabase
      .from('clientes') // Asegúrate de que 'clientes' sea el nombre correcto de tu tabla
      .select('*');
    if (error) {
      throw error;
    }
    return data;
  }
}
