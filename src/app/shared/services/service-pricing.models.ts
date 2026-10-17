export function money(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Ingresa un precio no negativo con máximo dos decimales, por ejemplo 12.50.');
  return text;
}
export function minutes(value: unknown): number {
  const text = String(value ?? '').trim();
  const result = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(result) || result <= 0) throw new Error('La duración debe ser un número entero de minutos mayor que cero.');
  return result;
}
export function decimalLabel(value: string): string {
  const [whole, fraction = ''] = value.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}
