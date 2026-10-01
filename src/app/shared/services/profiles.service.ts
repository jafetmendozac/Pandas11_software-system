import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CurrentAccount {
  userId: string;
  email: string;
  provider: string;
  providerLabel: string;
  profile: Profile | null;
  metadata: {
    first_name?: string;
    last_name?: string;
  };
}

export function profileLabel(profile: Profile | null | undefined): string {
  if (!profile) return 'Perfil sin nombre';
  const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
  return name || 'Perfil sin nombre';
}

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(): Promise<Profile[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, first_name, last_name, active, created_at, updated_at')
      .order('first_name', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  async getCurrent(): Promise<CurrentAccount> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;

    const user = data.user;
    if (!user?.id) throw new Error('No hay una sesión activa.');

    const { data: profile, error: profileError } = await this.supabase.client
      .from('profiles')
      .select('id, first_name, last_name, active, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const provider = this.resolveProvider(user);

    return {
      userId: user.id,
      email: user.email ?? '',
      provider,
      providerLabel: this.formatProvider(provider),
      profile: (profile as Profile | null) ?? null,
      metadata: {
        first_name: typeof user.user_metadata?.['first_name'] === 'string'
          ? user.user_metadata['first_name']
          : undefined,
        last_name: typeof user.user_metadata?.['last_name'] === 'string'
          ? user.user_metadata['last_name']
          : undefined,
      },
    };
  }

  async update(changes: { first_name: string; last_name: string }): Promise<void> {
    const { data: authData, error: authError } = await this.supabase.client.auth.getUser();
    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error('No hay una sesión activa.');

    const now = new Date().toISOString();
    const { data: updated, error } = await this.supabase.client
      .from('profiles')
      .update({
        first_name: changes.first_name,
        last_name: changes.last_name,
        updated_at: now,
      })
      .eq('id', userId)
      .select('id');
    if (error) throw error;

    if (updated && updated.length > 0) return;

    const { error: insertError } = await this.supabase.client.from('profiles').insert({
      id: userId,
      first_name: changes.first_name,
      last_name: changes.last_name,
      active: true,
      created_at: now,
      updated_at: now,
    });
    if (insertError) throw insertError;
  }

  private resolveProvider(user: User): string {
    const fromAppMetadata = user.app_metadata?.['provider'];
    if (typeof fromAppMetadata === 'string' && fromAppMetadata) {
      return fromAppMetadata;
    }
    return user.identities?.[0]?.provider ?? '';
  }

  private formatProvider(provider: string): string {
    const labels: Record<string, string> = {
      email: 'Correo y contraseña',
      phone: 'Teléfono',
      google: 'Google',
      facebook: 'Facebook',
      github: 'GitHub',
      gitlab: 'GitLab',
      apple: 'Apple',
      twitter: 'X (Twitter)',
      discord: 'Discord',
      spotify: 'Spotify',
      slack: 'Slack',
    };
    if (!provider) return 'No disponible';
    return labels[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}
