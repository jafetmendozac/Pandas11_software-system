import { weekdayInLima } from './home-flyers.models';

describe('Día semanal de la portada', () => {
  it('cambia de domingo a lunes en Lima, independientemente del día UTC', () => {
    expect(weekdayInLima(new Date('2026-10-26T04:59:59Z'))).toBe(7);
    expect(weekdayInLima(new Date('2026-10-26T05:00:00Z'))).toBe(1);
  });
});
