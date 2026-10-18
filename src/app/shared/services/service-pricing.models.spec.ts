import { money, minutes, decimalLabel } from './service-pricing.models';
describe('Validación de importes y duración',()=>{
  it('distingue cero explícito de un campo vacío',()=>{expect(money('0')).toBe('0');expect(()=>money('')).toThrow();expect(()=>money(null)).toThrow();});
  it('conserva decimales sin convertirlos a Number',()=>{expect(money('9007199254740993.25')).toBe('9007199254740993.25');expect(decimalLabel('12.3')).toBe('12.30');});
  it('rechaza negativos, exceso de precisión y valores no finitos',()=>{for(const value of ['-1','1.234','NaN','Infinity','1e5'])expect(()=>money(value)).toThrow();});
  it('exige minutos enteros positivos',()=>{expect(minutes('60')).toBe(60);for(const value of ['',0,-1,1.5,null])expect(()=>minutes(value)).toThrow();});
});
