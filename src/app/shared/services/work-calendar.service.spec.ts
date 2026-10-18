import { TestBed } from '@angular/core/testing';
import { WorkCalendarService, limaDateTime, validateWorkRange } from './work-calendar.service';
import { SupabaseService } from './supabase.service';
describe('Calendario laboral: contrato de horas',()=>{
  let rpc:jasmine.Spy;let service:WorkCalendarService;
  beforeEach(()=>{
    rpc=jasmine.createSpy().and.resolveTo({data:{windows:[]},error:null});
    TestBed.configureTestingModule({providers:[WorkCalendarService,{provide:SupabaseService,useValue:{client:{rpc}}}]});
    service=TestBed.inject(WorkCalendarService);
  });
  it('rechaza intervalos invertidos, incompletos o que cruzan medianoche',async()=>{
    for(const [a,b] of [['12:00','12:00'],['23:00','01:00'],['07:00','24:00'],['','08:00']])expect(()=>validateWorkRange(a,b)).toThrow();
    await expectAsync(service.availability('e','2026-07-28','12:00','11:00',false)).toBeRejected();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('envía horas de pared sin conversión por navegador y permite consultar solo fecha',async()=>{
    await service.availability('e','2026-07-28','17:00','19:00',true);
    expect(rpc).toHaveBeenCalledWith('employee_availability',{p_employee_id:'e',p_date:'2026-07-28',p_start:'17:00',p_end:'19:00',p_requires_specialist:true});
    await service.availability('e','2026-07-28','','',false);
    expect(rpc.calls.mostRecent().args[1].p_start).toBeNull();
    expect(limaDateTime('2026-07-29T00:00:00Z')).toBe('2026-07-28 19:00');
  });
  it('conserva bloqueos locales y propaga el error de persistencia al formulario',async()=>{
    const row={employee_id:'e',starts_local:'2026-07-28T09:00',ends_local:'2026-07-29T10:00',reason:'Recojo'};
    rpc.and.resolveTo({error:{message:'Sin permiso'}});
    await expectAsync(service.saveBlock(row,'create')).toBeRejectedWithError('Sin permiso');
    expect(rpc).toHaveBeenCalledWith('save_time_block',{p_input:row});
  });
  it('valida motivo/día y no escribe si faltan datos',async()=>{
    await expectAsync(service.saveBlock({starts_local:'2026-07-28T09:00',ends_local:'2026-07-28T10:00',reason:' '},'create')).toBeRejected();
    await expectAsync(service.savePeriod('employee',{weekday:0,start_time:'07:00',end_time:'18:00'},'create','e')).toBeRejected();
    expect(rpc).not.toHaveBeenCalled();
  });
});
