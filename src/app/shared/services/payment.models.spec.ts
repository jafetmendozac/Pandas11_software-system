import { paymentAmount, paymentReference } from './payment.models';
describe('Importes y referencias de pagos', () => {
  it('conserva precisión decimal superior a Number y acepta centavos', () => {
    expect(paymentAmount('9007199254740993.25')).toBe('9007199254740993.25');
    expect(paymentAmount(' 0.01 ')).toBe('0.01');
  });
  it('rechaza cero, vacío, negativos, valores especiales y exceso de decimales', () => {
    for (const value of ['', null, '0', '00.00', '-1', 'NaN', 'Infinity', '1.234', '1e2']) expect(() => paymentAmount(value)).toThrow();
  });
  it('normaliza vacíos sin inventar comprobantes y limita referencias', () => {
    expect(paymentReference('  ')).toBeNull(); expect(paymentReference(' OP-1 ')).toBe('OP-1');
    expect(() => paymentReference('x'.repeat(121))).toThrow();
  });
});
