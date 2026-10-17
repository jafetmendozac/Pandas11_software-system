import { TestBed } from '@angular/core/testing';
import { WorkCalendarComponent } from './work-calendar.component';
import { Availability, WorkCalendarService, WORK_NOTICE } from '../../../services/work-calendar.service';
import { AuthorizationService } from '../../../services/authorization.service';
const employee={id:'e',profile_id:'p',employee_name:'Trabajador de prueba',skill_level:'ALL_SERVICES',active:true,profile_active:true};
const available:Availability={employee_id:'e',date:'2026-07-28',timezone:'America/Lima',interval_covered:true,can_start_service:true,reasons:[],windows:[{starts_at:'2026-07-28T22:00:00Z',ends_at:'2026-07-29T00:00:00Z'}],occupancy_verified:false,notice:WORK_NOTICE};
describe('Consulta laboral y gestión protegida',()=>{
  let calendar:{load:jasmine.Spy;availability:jasmine.Spy;savePeriod:jasmine.Spy;saveBlock:jasmine.Spy};
  let authorization:{has:jasmine.Spy};
  beforeEach(()=>{
    calendar={load:jasmine.createSpy().and.resolveTo({schedules:[],business:[],blocks:[]}),availability:jasmine.createSpy().and.resolveTo(available),savePeriod:jasmine.createSpy().and.resolveTo(),saveBlock:jasmine.createSpy().and.resolveTo()};
    authorization={has:jasmine.createSpy().and.returnValue(true)};
    TestBed.configureTestingModule({imports:[WorkCalendarComponent],providers:[{provide:WorkCalendarService,useValue:calendar},{provide:AuthorizationService,useValue:authorization}]});
  });
  const fixture=async()=>{
    const f=TestBed.createComponent(WorkCalendarComponent);f.componentRef.setInput('employee',employee);f.detectChanges();await f.whenStable();return f;
  };
  it('muestra aviso explícito, cobertura y hora Lima aun al cambiar de fecha UTC',async()=>{
    const f=await fixture();f.componentInstance.date='2026-07-28';f.componentInstance.start='17:00';f.componentInstance.end='19:00';await f.componentInstance.calculate();f.detectChanges();
    expect(f.nativeElement.textContent).toContain(WORK_NOTICE);
    expect(f.nativeElement.textContent).toContain('2026-07-28 19:00');
    expect(f.nativeElement.textContent).toContain('Cobertura laboral del intervalo: Sí');
  });
  it('descarta una respuesta cuando cambian fecha o empleado',async()=>{
    const f=await fixture();let resolve!:(a:Availability)=>void;calendar.availability.and.callFake(()=>new Promise(r=>resolve=r));
    f.componentInstance.date='2026-07-28';const pending=f.componentInstance.calculate();
    f.componentInstance.date='2026-07-29';f.componentInstance.invalidate();resolve(available);await pending;
    expect(f.componentInstance.result()).toBeNull();expect(f.componentInstance.calculating()).toBeFalse();
  });
  it('gestiona carga/error de consulta y limpia resultados anteriores',async()=>{
    const f=await fixture();f.componentInstance.date='2026-07-28';await f.componentInstance.calculate();
    calendar.availability.and.rejectWith(new Error('Consulta denegada'));await f.componentInstance.calculate();f.detectChanges();
    expect(f.componentInstance.result()).toBeNull();expect(f.nativeElement.textContent).toContain('Consulta denegada');
    expect(f.componentInstance.calculating()).toBeFalse();
  });
  it('STAFF consulta sin botones de escritura ni acceso a callbacks de gestión',async()=>{
    authorization.has.and.callFake((p:string)=>!p.endsWith('.manage'));
    const f=await fixture();f.detectChanges();
    expect(f.componentInstance.businessTable?.allowCreate).toBeFalse();
    expect(f.componentInstance.blockTable?.allowEdit).toBeFalse();
    await expectAsync(f.componentInstance.saveShift({},'create')).toBeRejectedWithError('No tienes permiso para cambiar horarios.');
    await expectAsync(f.componentInstance.saveBlock({},'create')).toBeRejected();
    expect(calendar.savePeriod).not.toHaveBeenCalled();expect(calendar.saveBlock).not.toHaveBeenCalled();
  });
  it('formulario de turnos conserva datos cuando el servidor rechaza un solapamiento',async()=>{
    const f=await fixture();const table=f.componentInstance.shiftTable!;
    table.openCreateForm();table.formData={weekday:'2',start_time:'10:00',end_time:'12:00'};
    calendar.savePeriod.and.rejectWith(new Error('El turno se solapa con otro turno'));
    await table.saveRow();f.detectChanges();
    expect(table.isFormOpen).toBeTrue();expect(table.formData['start_time']).toBe('10:00');
    expect(table.formError).toContain('se solapa');expect(f.componentInstance.data().schedules).toEqual([]);
  });
  it('un cambio confirmado invalida una consulta laboral anterior',async()=>{
    const f=await fixture();f.componentInstance.result.set(available);
    await f.componentInstance.saveBlock({id:'b'},'delete');
    expect(f.componentInstance.result()).toBeNull();expect(calendar.load).toHaveBeenCalledTimes(2);
  });
  it('permite guardar un bloqueo global sin exigir employee_id',async()=>{
    const f=await fixture();const table=f.componentInstance.blockTable!;
    table.openCreateForm();table.formData={employee_id:'',starts_local:'2026-07-28T09:00',ends_local:'2026-07-28T10:00',reason:'Cierre temporal'};
    await table.saveRow();
    expect(table.formError).toBe('');expect(table.isFormOpen).toBeFalse();
    expect(calendar.saveBlock).toHaveBeenCalledWith(jasmine.objectContaining({employee_id:'',reason:'Cierre temporal'}),'create');
  });
});
