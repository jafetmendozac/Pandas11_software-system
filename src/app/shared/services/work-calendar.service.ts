import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
export interface WorkPeriod extends TableRow { id:string; weekday:number; start_time:string; end_time:string; employee_id?:string; }
export interface TimeBlock extends TableRow { id:string; employee_id:string|null; starts_local:string; ends_local:string; reason:string; created_by:string; }
export interface WorkCalendar { schedules:WorkPeriod[]; business:WorkPeriod[]; blocks:TimeBlock[]; }
export interface Availability {
  employee_id:string; date:string; timezone:'America/Lima'; interval_covered:boolean|null; can_start_service:boolean|null;
  reasons:string[]; windows:{starts_at:string;ends_at:string}[]; occupancy_verified:false; notice:string;
}
export const WORK_NOTICE='Horario habilitado; ocupación de citas/recojos no verificada';
export const WEEKDAYS=[{value:'1',label:'Lunes'},{value:'2',label:'Martes'},{value:'3',label:'Miércoles'},{value:'4',label:'Jueves'},{value:'5',label:'Viernes'},{value:'6',label:'Sábado'}];
export function workError(error:unknown):string {
  if(error && typeof error==='object' && 'message' in error) return String(error.message);
  return 'No se pudo completar la operación. Comprueba tu acceso y vuelve a intentarlo.';
}
export function validateWorkRange(start:string,end:string):void {
  const time=/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  if(!time.test(start)||!time.test(end)||start.padEnd(8,':00')>=end.padEnd(8,':00')) throw new Error('Indica un inicio anterior al fin, dentro del mismo día.');
}
// Intl siempre usa Lima, sin convertir entradas de pared con new Date(localString).
export function limaDateTime(instant:string):string {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant));
  const part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===type)?.value??'';
  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`;
}
@Injectable({providedIn:'root'})
export class WorkCalendarService {
  constructor(private readonly supabase:SupabaseService){}
  async load(employeeId:string|null):Promise<WorkCalendar> {
    const {data,error}=await this.supabase.client.rpc('work_calendar',{p_employee_id:employeeId});
    if(error) throw new Error(error.message); return data as WorkCalendar;
  }
  async savePeriod(kind:'employee'|'business',row:TableRow,mode:'create'|'update'|'delete',employeeId:string|null):Promise<void> {
    if(mode!=='delete') {
      validateWorkRange(String(row['start_time']??''),String(row['end_time']??''));
      if(!WEEKDAYS.some(d=>d.value===String(row['weekday']))) throw new Error('Selecciona un día entre lunes y sábado.');
      if(kind==='employee'&&!employeeId) throw new Error('Selecciona un empleado.');
    }
    const {error}=mode==='delete'
      ?await this.supabase.client.rpc('remove_work_period',{p_kind:kind,p_id:row['id']})
      :await this.supabase.client.rpc('save_work_period',{p_kind:kind,p_input:{...row,employee_id:employeeId},...(mode==='update'?{p_id:row['id']}:{})});
    if(error) throw new Error(error.message);
  }
  async saveBlock(row:TableRow,mode:'create'|'update'|'delete'):Promise<void> {
    if(mode!=='delete') {
      const a=String(row['starts_local']??''),b=String(row['ends_local']??'');
      const local=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
      if(!local.test(a)||!local.test(b)||a>=b) throw new Error('Revisa el inicio y fin del bloqueo en hora de Lima.');
      if(!String(row['reason']??'').trim()) throw new Error('El motivo es obligatorio.');
    }
    const {error}=mode==='delete'
      ?await this.supabase.client.rpc('remove_time_block',{p_id:row['id']})
      :await this.supabase.client.rpc('save_time_block',{p_input:row,...(mode==='update'?{p_id:row['id']}:{})});
    if(error) throw new Error(error.message);
  }
  async availability(employeeId:string,date:string,start:string,end:string,specialist:boolean):Promise<Availability> {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Selecciona una fecha.');
    if(start||end) validateWorkRange(start,end);
    const {data,error}=await this.supabase.client.rpc('employee_availability',{p_employee_id:employeeId,p_date:date,p_start:start||null,p_end:end||null,p_requires_specialist:specialist});
    if(error) throw new Error(error.message); return data as Availability;
  }
}
