import { addMonths, monthsInRange, parseMonthlyReports, reportCsv } from './monthly-reports.models';

describe('Reportes mensuales', () => {
  const data = {
    timezone: 'America/Lima', from: '2026-09', to: '2026-10', rows: [
      { month: '2026-09', service_collections: '10.20', product_collections: '2.30', total_collections: '12.50', completed_appointments: 2, previous_clients: 0, returning_clients: 0, retention_rate: null },
      { month: '2026-10', service_collections: '0.00', product_collections: '1.05', total_collections: '1.05', completed_appointments: 1, previous_clients: 2, returning_clients: 1, retention_rate: '50.00' },
    ],
  };

  it('calcula meses cruzando el año y rechaza intervalos invertidos', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthsInRange('2025-12', '2026-01')).toBe(2);
    expect(monthsInRange('2026-10', '2026-09')).toBe(0);
  });

  it('valida filas ordenadas, importes exactos y ausencia de base', () => {
    expect(parseMonthlyReports(data, '2026-09', '2026-10').rows.length).toBe(2);
    expect(() => parseMonthlyReports({ ...data, rows: [data.rows[1], data.rows[0]] }, '2026-09', '2026-10')).toThrow();
    expect(() => parseMonthlyReports({ ...data, rows: [{ ...data.rows[0], retention_rate: '0.00' }, data.rows[1]] }, '2026-09', '2026-10')).toThrow();
    expect(() => parseMonthlyReports({ ...data, rows: [{ ...data.rows[0], total_collections: '1e9' }, data.rows[1]] }, '2026-09', '2026-10')).toThrow();
  });

  it('exporta ambos CSV con BOM, tasa vacía y mes provisional', () => {
    const report = parseMonthlyReports(data, '2026-09', '2026-10');
    const collections = reportCsv(report, 'collections', '2026-10');
    const retention = reportCsv(report, 'retention', '2026-10');
    expect(collections.startsWith('\uFEFF')).toBeTrue();
    expect(collections).toContain('"10.20","2.30","12.50"');
    expect(retention).toContain('"2026-09","0","0","","Histórico"');
    expect(retention).toContain('"2026-10","2","1","50.00","Provisional"');
  });
});
