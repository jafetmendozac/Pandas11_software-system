import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Reemplaza estos valores con tus credenciales de Supabase
    // En un proyecto real, estas deberían venir de variables de entorno
    // o un archivo de configuración separado.
    const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Ejemplo de un método para autenticación
  async signInWithEmail(email: string, password: string) {
    const { user, session, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return { user, session };
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
