export interface HomeFlyer {
  weekday: number;
  object_path: string | null;
  alt_text: string | null;
  published: boolean;
  version: number;
  updated_at: string | null;
  updated_by?: string | null;
}

export const HOME_FLYER_DAYS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
] as const;

export function weekdayInLima(date: Date): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', weekday: 'short',
  }).format(date);
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names.indexOf(name) + 1;
}
