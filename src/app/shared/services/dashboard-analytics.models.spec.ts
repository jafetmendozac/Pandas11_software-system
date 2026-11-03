import { limaMonth, penAmount, trendLabel } from './dashboard-analytics.models';

describe('Formato del dashboard', () => {
  it('determina el mes de Trujillo al cruzar medianoche UTC', () => {
    expect(limaMonth(new Date('2026-11-01T04:59:59Z'))).toBe('2026-10');
    expect(limaMonth(new Date('2026-11-01T05:00:00Z'))).toBe('2026-11');
  });

  it('muestra centavos y cifras grandes sin convertir a Number', () => {
    expect(penAmount('12345678901234567890.05')).toBe('S/ 12,345,678,901,234,567,890.05');
    expect(penAmount('0')).toBe('S/ 0.00');
    expect(trendLabel('2026-10')).toContain('26');
  });
});
