import { appointmentInput, addLocalMinutes, draftItem, DraftItem, limaInstant, localLima, stageInputs } from './appointment.models';
function item():DraftItem{return {key:'key',pet_id:'pet',service_id:'service',pet_name:'Perro',service_name:'Baño y corte',price:'100.10',duration_minutes:120,specialist:true,notes:'nota',weight_kg_at_visit:null,start:'2030-07-29T17:00',quoting:false,quoteRevision:0,stages:[{stage:'BATH',employee_id:'assistant',minutes:60},{stage:'CUT',employee_id:'specialist',minutes:60}]};}
describe('Contrato de agenda: snapshots y tiempos',()=>{
 it('convierte Lima sin depender de la zona del navegador ni perder el día UTC',()=>{
  expect(limaInstant('2030-07-29T19:00')).toBe('2030-07-30T00:00:00Z');
  expect(localLima('2030-07-30T00:00:00Z')).toBe('2030-07-29T19:00:00');
 });
 it('genera baño y corte consecutivos después17 con empleados distintos',()=>{
  const stages=stageInputs(item());expect(stages[1].starts_local).toBe('2030-07-29T18:00:00');expect(stages[1].ends_local).toBe('2030-07-29T19:00:00');
  expect(stages.map(s=>s.employee_id)).toEqual(['assistant','specialist']);
 });
 it('no envía precios, duración, habilidad u origen controlados por el servidor',()=>{
  const payload=appointmentInput('client','nota',[item()]);
  expect(Object.keys(payload).sort()).toEqual(['client_id','client_notes','items']);
  expect(Object.keys(payload.items[0]).sort()).toEqual(['notes','pet_id','service_id','stages','weight_kg_at_visit']);
 });
 it('rechaza reparto incompleto, minutos fraccionarios y ausencia de trabajador',()=>{
  const i=item();i.stages[0].minutes=30;expect(()=>stageInputs(i)).toThrow();
  i.stages[0].minutes=60.5;expect(()=>stageInputs(i)).toThrow();
  i.stages[0].minutes=60;i.stages[1].employee_id='';expect(()=>stageInputs(i)).toThrow();
 });
 it('mantiene ID y duración del snapshot al volver a editar',()=>{
  const i=draftItem({id:'item',pet_id:'pet',service_id:'service',pet_name:'P',service_name:'S',price:'9007199254740993.25',duration_minutes:60,requires_specialist_snapshot:false,notes:null,weight_kg_at_visit:null,stages:[{id:'stage',item_id:'item',employee_id:'e',employee_name:'E',stage:'SERVICE',starts_at:'2030-07-29T22:00:00Z',ends_at:'2030-07-29T23:00:00Z'}]});
  expect(i.price).toBe('9007199254740993.25');expect(i.stages[0].minutes).toBe(60);
  expect(appointmentInput('c','',[i]).items[0].id).toBe('item');
 });
 it('no acepta alta sin items o mientras se cotiza un servicio',()=>{
  expect(()=>appointmentInput('c','',[])).toThrow();const i=item();i.quoting=true;expect(()=>appointmentInput('c','',[i])).toThrow();
  expect(()=>addLocalMinutes('2030-07-29T08:00',1.5)).toThrow();
 });
});
