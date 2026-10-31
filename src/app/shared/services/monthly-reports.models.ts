export interface MonthlyReportRow {
  month: string;
  service_collections: string;
  product_collections: string;
  total_collections: string;
  completed_appointments: number;
  previous_clients: number;
  returning_clients: number;
  retention_rate: string | null;
}

export interface MonthlyReports {
  timezone: 'America/Lima';
  from: string;
  to: string;
  rows: MonthlyReportRow[];
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONEY = /^\d+\.\d{2}$/;
const RATE = /^(?:100\.00|\d{1,2}\.\d{2})$/;

export function isMonth(value: string): boolean { return MONTH.test(value); }

export function monthsInRange(from: string, to: string): number {
  if (!isMonth(from) || !isMonth(to)) return 0;
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  return (toYear - fromYear) * 12 + toMonth - fromMonth + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRow(value: unknown): value is MonthlyReportRow {
  return isRecord(value) && typeof value['month'] === 'string' && isMonth(value['month'])
    && typeof value['service_collections'] === 'string' && MONEY.test(value['service_collections'])
    && typeof value['product_collections'] === 'string' && MONEY.test(value['product_collections'])
    && typeof value['total_collections'] === 'string' && MONEY.test(value['total_collections'])
    && Number.isSafeInteger(value['completed_appointments']) && Number(value['completed_appointments']) >= 0
    && Number.isSafeInteger(value['previous_clients']) && Number(value['previous_clients']) >= 0
    && Number.isSafeInteger(value['returning_clients']) && Number(value['returning_clients']) >= 0
    && Number(value['returning_clients']) <= Number(value['previous_clients'])
    && (value['retention_rate'] === null || typeof value['retention_rate'] === 'string' && RATE.test(value['retention_rate']));
}

export function parseMonthlyReports(value: unknown, from: string, to: string): MonthlyReports {
  const count = monthsInRange(from, to);
  if (!count || count > 12 || !isRecord(value) || value['timezone'] !== 'America/Lima'
    || value['from'] !== from || value['to'] !== to || !Array.isArray(value['rows'])
    || value['rows'].length !== count || !value['rows'].every(isRow)) {
    throw new Error('Respuesta de reportes inválida');
  }
  const rows = value['rows'] as MonthlyReportRow[];
  if (rows.some((row, index) => row.month !== addMonths(from, index)
    || (row.previous_clients === 0) !== (row.retention_rate === null))) {
    throw new Error('Meses o tasas de reportes inválidos');
  }
  return value as unknown as MonthlyReports;
}

export function addMonths(month: string, offset: number): string {
  const [year, number] = month.split('-').map(Number);
  const total = year * 12 + number - 1 + offset;
  return `${Math.floor(total / 12)}-${String(total % 12 + 1).padStart(2, '0')}`;
}

export type ReportKind = 'collections' | 'retention';

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function reportCsv(report: MonthlyReports, kind: ReportKind, currentMonth: string): string {
  const headers = kind === 'collections'
    ? ['Mes', 'Cobros de servicios (PEN)', 'Cobros de productos (PEN)', 'Total cobrado (PEN)', 'Citas completadas', 'Estado del mes']
    : ['Mes', 'Clientes mes anterior', 'Clientes que repitieron', 'Retención (%)', 'Estado del mes'];
  const lines = report.rows.map(row => kind === 'collections'
    ? [row.month, row.service_collections, row.product_collections, row.total_collections,
       String(row.completed_appointments), row.month === currentMonth ? 'Provisional' : 'Histórico']
    : [row.month, String(row.previous_clients), String(row.returning_clients), row.retention_rate ?? '',
       row.month === currentMonth ? 'Provisional' : 'Histórico']);
  return '\uFEFF' + [headers, ...lines].map(line => line.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
