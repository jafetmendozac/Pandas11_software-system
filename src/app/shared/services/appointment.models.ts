import { Temporal } from 'temporal-polyfill';
export type AppointmentStatus='REQUESTED'|'PENDING'|'CONFIRMED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'|'NO_SHOW';
export type StageKind='SERVICE'|'BATH'|'CUT';
export type PickupType='PICKUP_ONLY'|'DROPOFF_ONLY'|'BOTH'|'NONE';
export interface AppointmentStage {id:string;item_id:string;employee_id:string;employee_name:string;stage:StageKind;starts_at:string;ends_at:string;}
export interface AppointmentItem {id:string;pet_id:string;service_id:string;pet_name:string;service_name:string;price:string;duration_minutes:number;requires_specialist_snapshot:boolean;notes:string|null;weight_kg_at_visit:number|null;stages:AppointmentStage[];}
export interface Appointment {id:string;client_id:string;client_name:string;starts_at:string;ends_at:string;status:AppointmentStatus;source:'INTERNAL'|'ONLINE';version:number;total_price:string;deposit_required:string;pickup_fee:string;pickup_type:PickupType;client_notes:string|null;cancel_reason:string|null;created_by:string;needs_attention:boolean;items:AppointmentItem[];}
export interface StageInput {employee_id:string;stage:StageKind;starts_local:string;ends_local:string;}
export interface ItemInput {id?:string;pet_id:string;service_id:string;notes:string;weight_kg_at_visit:number|null;stages:StageInput[];}
export interface AppointmentInput {client_id:string;client_notes:string;items:ItemInput[];}
export interface ReservationAvailability {windows:{starts_at:string;ends_at:string}[];interval_covered:boolean|null;can_start_service:boolean|null;reasons:string[];notice:string;}
export interface AppointmentNote {notes:string|null;updated_by:string;updated_at:string;}
export interface DraftStage {stage:StageKind;employee_id:string;minutes:number|null;}
export interface DraftItem {key:string;id?:string;pet_id:string;service_id:string;pet_name:string;service_name:string;price:string;duration_minutes:number;specialist:boolean;notes:string;weight_kg_at_visit:number|null;start:string;stages:DraftStage[];quoting:boolean;quoteRevision:number;}
export const STATUS_LABELS:Record<AppointmentStatus,string>={REQUESTED:'Solicitada',PENDING:'Pendiente',CONFIRMED:'Confirmada',IN_PROGRESS:'En atención',COMPLETED:'Completada',CANCELLED:'Cancelada',NO_SHOW:'No asistió'};
export const STAGE_LABELS:Record<StageKind,string>={SERVICE:'Servicio completo',BATH:'Baño',CUT:'Corte'};
export const PICKUP_TYPE_LABELS:Record<PickupType,string>={PICKUP_ONLY:'Solo recojo',DROPOFF_ONLY:'Solo regreso',BOTH:'Recojo y regreso',NONE:'Sin transporte'};
export function localLima(instant:string):string{return Temporal.Instant.from(instant).toZonedDateTimeISO('America/Lima').toPlainDateTime().toString({smallestUnit:'second'});}
export function addLocalMinutes(start:string,minutes:number):string {
 if(!Number.isSafeInteger(minutes)||minutes<0)throw new Error('Indica minutos enteros positivos.');
 return Temporal.PlainDateTime.from(start).add({minutes}).toString({smallestUnit:'second'});
}
export function limaInstant(local:string):string {return Temporal.PlainDateTime.from(local).toZonedDateTime('America/Lima').toInstant().toString();}
export function stageInputs(item:DraftItem):StageInput[]{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(item.start))throw new Error('Indica fecha y hora de inicio para cada servicio.');
 let cursor=item.start;
 const stages=item.stages.map(s=>{
  if(!s.employee_id||s.minutes===null||!Number.isSafeInteger(s.minutes)||s.minutes<=0)throw new Error('Completa trabajador y minutos positivos de cada etapa.');
  const end=addLocalMinutes(cursor,s.minutes);const row={employee_id:s.employee_id,stage:s.stage,starts_local:cursor,ends_local:end};cursor=end;return row;
 });
 if(item.stages.reduce((sum,s)=>sum+(s.minutes??0),0)!==item.duration_minutes)throw new Error('Las etapas deben sumar la duración del servicio.');
 return stages;
}
export function appointmentInput(clientId:string,notes:string,items:DraftItem[]):AppointmentInput {
 if(!clientId||!items.length)throw new Error('Selecciona cliente y añade servicios por mascota.');
 const petIds=new Set(items.map(item=>item.pet_id).filter(Boolean));
 if(petIds.size!==1||items.some(item=>!item.pet_id))throw new Error('Una cita solo puede incluir una mascota.');
 const combinations=new Set<string>();
 return {client_id:clientId,client_notes:notes,items:items.map(i=>{
  if(!i.pet_id||!i.service_id||i.quoting||i.duration_minutes<=0)throw new Error('Completa la mascota y el servicio cotizado.');
  const combination=`${i.pet_id}:${i.service_id}`;
  if(combinations.has(combination))throw new Error('Este servicio ya se agregó para la misma mascota.');
  combinations.add(combination);
  return {...(i.id?{id:i.id}:{}),pet_id:i.pet_id,service_id:i.service_id,notes:i.notes,weight_kg_at_visit:i.weight_kg_at_visit,stages:stageInputs(i)};
 })};
}
export function draftItem(item:AppointmentItem):DraftItem {
 return {key:item.id,id:item.id,pet_id:item.pet_id,service_id:item.service_id,pet_name:item.pet_name,service_name:item.service_name,price:item.price,duration_minutes:item.duration_minutes,specialist:item.requires_specialist_snapshot,notes:item.notes??'',weight_kg_at_visit:item.weight_kg_at_visit,start:localLima(item.stages[0].starts_at),quoting:false,quoteRevision:0,stages:item.stages.map(s=>({stage:s.stage,employee_id:s.employee_id,minutes:Temporal.Instant.from(s.ends_at).since(Temporal.Instant.from(s.starts_at)).total('minutes')}))};
}
