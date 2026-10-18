import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Appointment, AppointmentInput, AppointmentNote, AppointmentStatus, ReservationAvailability, StageInput } from './appointment.models';
import { PageResult } from './clientes.service';
@Injectable({providedIn:'root'})
export class AppointmentsService {
 constructor(private readonly supabase:SupabaseService){}
 private async rpc<T>(name:string,args:Record<string,unknown>):Promise<T>{
  const {data,error}=await this.supabase.client.rpc(name,args);if(error)throw new Error(error.message);return data as T;
 }
 async range(from:string,until:string,employee:string|null=null,status:AppointmentStatus|null=null,search=''):Promise<Appointment[]>{
  const rows:Appointment[]=[];
  for(let page=1;;page++){
   const result=await this.rpc<PageResult<Appointment>>('search_appointments',{p_from:from,p_until:until,p_page:page,p_size:100,p_employee:employee,p_status:status,p_search:search});
   rows.push(...result.rows);if(rows.length>=result.total||!result.rows.length)return rows;
  }
 }
 get(id:string):Promise<Appointment>{return this.rpc('get_appointment',{p_id:id});}
 save(input:AppointmentInput,current:Appointment|null):Promise<Appointment>{return this.rpc('save_internal_appointment',{p_input:input,...(current?{p_id:current.id,p_expected_version:current.version}:{})});}
 transition(current:Appointment,target:AppointmentStatus,reason=''):Promise<Appointment>{return this.rpc('change_appointment_status',{p_id:current.id,p_expected_version:current.version,p_target:target,p_reason:reason||null});}
 async internal(id:string):Promise<AppointmentNote|null>{
  const {data,error}=await this.supabase.client.from('appointment_internal').select('notes,updated_by,updated_at').eq('appointment_id',id).maybeSingle();
  if(error)throw new Error(error.message);return data as AppointmentNote|null;
 }
 saveInternal(current:Appointment,notes:string):Promise<Appointment>{return this.rpc('save_appointment_internal',{p_id:current.id,p_notes:notes,p_expected_version:current.version});}
 availability(stage:StageInput,specialist:boolean,exclude:string|null,continuation:boolean):Promise<ReservationAvailability>{
  return this.rpc('appointment_availability',{p_employee_id:stage.employee_id,p_date:stage.starts_local.slice(0,10),p_start:stage.starts_local.slice(11),p_end:stage.ends_local.slice(11),p_requires_specialist:specialist,p_exclude_appointment_id:exclude,p_continuation:continuation});
 }
}
