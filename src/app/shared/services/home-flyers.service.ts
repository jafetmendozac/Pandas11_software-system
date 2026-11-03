import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { HomeFlyer, weekdayInLima } from './home-flyers.models';

const BUCKET = 'home-flyers';
const MAX_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};

@Injectable({ providedIn: 'root' })
export class HomeFlyersService {
  private readonly supabase = inject(SupabaseService).client;

  async today(): Promise<HomeFlyer | null> {
    const { data, error } = await this.supabase.from('home_flyers')
      .select('weekday,object_path,alt_text,published,version,updated_at')
      .eq('weekday', weekdayInLima(new Date())).eq('published', true).maybeSingle();
    if (error) throw error;
    return data as HomeFlyer | null;
  }

  async list(): Promise<HomeFlyer[]> {
    const { data, error } = await this.supabase.from('home_flyers')
      .select('weekday,object_path,alt_text,published,version,updated_at,updated_by')
      .order('weekday');
    if (error) throw error;
    return data as HomeFlyer[];
  }

  async signedUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(BUCKET)
      .createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  }

  preparePath(weekday: number, file: File): string {
    const extension = EXTENSIONS[file.type];
    if (!extension || file.size === 0 || file.size > MAX_SIZE) {
      throw new Error('Usa una imagen JPG, PNG o WebP de hasta 5 MiB.');
    }
    return `${weekday}/${crypto.randomUUID()}.${extension}`;
  }

  async upload(path: string, file: File): Promise<void> {
    const { error } = await this.supabase.storage.from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '300' });
    if (error) throw error;
  }

  async exists(path: string): Promise<boolean> {
    const { error } = await this.supabase.storage.from(BUCKET).info(path);
    if (!error) return true;
    if ('statusCode' in error && String(error.statusCode) === '404') return false;
    throw error;
  }

  async save(input: {
    weekday: number; path: string | null; alt: string | null;
    published: boolean; expectedVersion: number;
  }): Promise<HomeFlyer> {
    const { data, error } = await this.supabase.rpc('save_home_flyer', {
      p_weekday: input.weekday, p_object_path: input.path,
      p_alt_text: input.alt, p_published: input.published,
      p_expected_version: input.expectedVersion,
    });
    if (error) throw error;
    return data as HomeFlyer;
  }

  async removeOrphan(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  }
}
