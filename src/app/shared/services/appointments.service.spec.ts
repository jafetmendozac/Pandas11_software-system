import { TestBed } from '@angular/core/testing';
import { AppointmentsService } from './appointments.service';
import { SupabaseService } from './supabase.service';
describe('Servicio agenda: lectura completa y control de errores',()=>{
 let rpc:jasmine.Spy;let service:AppointmentsService;
 beforeEach(()=>{rpc=jasmine.createSpy();TestBed.configureTestingModule({providers:[AppointmentsService,{provide:SupabaseService,useValue:{client:{rpc}}}]});service=TestBed.inject(AppointmentsService);});
 it('recorre todas las páginas sin truncar en 1000 citas y conserva filtros',async()=>{
  rpc.and.callFake((_name:string,args:{p_page:number})=>Promise.resolve({data:{rows:Array.from({length:args.p_page===11?2:100},(_,i)=>({id:`${args.p_page}-${i}`})),total:1002},error:null}));
  const rows=await service.range('2030-07-29T00:00:00-05:00','2030-07-30T00:00:00-05:00','employee','CONFIRMED','perro');
  expect(rows.length).toBe(1002);expect(rpc).toHaveBeenCalledTimes(11);expect(rpc.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({p_employee:'employee',p_status:'CONFIRMED',p_search:'perro',p_page:11}));
 });
 it('propaga el conflicto del servidor sin reintentar una escritura automáticamente',async()=>{
  rpc.and.resolveTo({error:{message:'La cita cambió'}});
  await expectAsync(service.save({client_id:'c',client_notes:'',items:[]},null)).toBeRejectedWithError('La cita cambió');expect(rpc).toHaveBeenCalledTimes(1);
 });
 it('disponibilidad de continuación envía explícitamente intervalo, habilidad y exclusión',async()=>{
  rpc.and.resolveTo({data:{},error:null});
  await service.availability({employee_id:'e',stage:'CUT',starts_local:'2030-07-29T18:00:00',ends_local:'2030-07-29T19:00:00'},true,'appointment',true);
  expect(rpc).toHaveBeenCalledWith('appointment_availability',jasmine.objectContaining({p_date:'2030-07-29',p_start:'18:00:00',p_end:'19:00:00',p_requires_specialist:true,p_exclude_appointment_id:'appointment',p_continuation:true}));
 });
});
