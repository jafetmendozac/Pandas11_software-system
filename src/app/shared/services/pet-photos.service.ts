import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

const BUCKET = 'pet-photos';
const MAX_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable({ providedIn: 'root' })
export class PetPhotosService {
  private readonly supabase = inject(SupabaseService).client;

  preparePath(petId: string, file: File): string {
    const extension = EXTENSIONS[file.type];
    if (!extension || file.size === 0 || file.size > MAX_SIZE)
      throw new Error('Usa una imagen JPG, PNG o WebP de hasta 5 MiB.');
    return `${petId}/${crypto.randomUUID()}.${extension}`;
  }

  async signedUrl(path: string | null): Promise<string | null> {
    if (!path)
      return null;
    const { data, error } = await this.supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error)
      throw error;
    return data.signedUrl;
  }

  async replace(petId: string, previousPath: string | null, file: File): Promise<string> {
    const path = this.preparePath(petId, file);
    const { error: uploadError } = await this.supabase.storage.from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '300' });
    if (uploadError)
      throw uploadError;
    const { data, error: updateError } = await this.supabase.from('pets').update({ photo_url: path }).eq('id', petId).select('photo_url').single();
    if (updateError || !data) {
      await this.supabase.storage.from(BUCKET).remove([path]);
      throw updateError ?? new Error('No se guardó la foto de la mascota.');
    }
    if (previousPath && previousPath !== path) {
      const { error } = await this.supabase.storage.from(BUCKET).remove([previousPath]);
      if (error)
        throw new Error('La foto nueva se guardó, pero no se pudo retirar la anterior.');
    }
    return path;
  }

  async remove(petId: string, path: string): Promise<void> {
    const { data, error } = await this.supabase.from('pets').update({ photo_url: null }).eq('id', petId).select('id').single();
    if (error || !data)
      throw error ?? new Error('No se pudo retirar la foto de la mascota.');
    const { error: storageError } = await this.supabase.storage.from(BUCKET).remove([path]);
    if (storageError)
      throw new Error('La foto dejó de estar vinculada, pero no se pudo retirar el archivo.');
  }
}
