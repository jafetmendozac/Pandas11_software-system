import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmpleadosComponent } from './empleados.component';
import { EmpleadosService } from '../../shared/services/empleados.service';
import { WorkCalendarService } from '../../shared/services/work-calendar.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
describe('Empleados: permisos y persistencia',()=>{
  let employees:{getAll:jasmine.Spy;eligibleProfiles:jasmine.Spy;create:jasmine.Spy;update:jasmine.Spy};
  let authorization:{has:jasmine.Spy};
  beforeEach(()=>{
    employees={getAll:jasmine.createSpy().and.resolveTo([]),eligibleProfiles:jasmine.createSpy().and.resolveTo([{id:'p',first_name:'Nombre',active:true}]),create:jasmine.createSpy().and.resolveTo(),update:jasmine.createSpy().and.resolveTo()};
    authorization={has:jasmine.createSpy().and.returnValue(true)};
    TestBed.configureTestingModule({imports:[EmpleadosComponent],providers:[provideRouter([]),{provide:EmpleadosService,useValue:employees},{provide:AuthorizationService,useValue:authorization},{provide:WorkCalendarService,useValue:{load:async()=>({schedules:[],business:[],blocks:[]})}}]});
  });
  it('STAFF carga todos los empleados sin consultar perfiles globales',async()=>{
    authorization.has.and.callFake((p:string)=>p==='employees.read'||p==='schedules.read'||p==='time_blocks.read'||p==='availability.read');
    const f=TestBed.createComponent(EmpleadosComponent);f.detectChanges();await f.whenStable();f.detectChanges();
    expect(employees.eligibleProfiles).not.toHaveBeenCalled();
    expect(employees.getAll).toHaveBeenCalled();expect(f.componentInstance.table?.allowEdit).toBeFalse();
  });
  it('conserva formulario ante rechazo del empleado y fija perfil solo al crear',async()=>{
    const f=TestBed.createComponent(EmpleadosComponent);f.detectChanges();await f.whenStable();f.detectChanges();
    const table=f.componentInstance.table!;table.openCreateForm();
    table.formData={profile_id:'p',skill_level:'ASSISTANT',active:'true',phone:'123'};
    employees.create.and.rejectWith(new Error('Perfil ya asociado'));await table.saveRow();
    expect(table.isFormOpen).toBeTrue();expect(table.formData['phone']).toBe('123');expect(table.formError).toBe('Perfil ya asociado');
    table.openEditForm({id:'e',profile_id:'p'});expect(table.editableColumns.some(c=>c.key==='profile_id')).toBeFalse();
  });
  it('descarta cargas atrasadas tras una recarga nueva',async()=>{
    const c=TestBed.createComponent(EmpleadosComponent).componentInstance;
    let resolve!:(data:unknown)=>void;employees.getAll.and.callFake(()=>new Promise(r=>resolve=r));
    const previous=c.loadEmployees();
    employees.getAll.and.resolveTo([{id:'nuevo'}]);await c.loadEmployees();
    resolve([{id:'viejo'}]);await previous;
    expect(c.total()).toBe(1);expect(c.tableData()[0]?.id).toBe('nuevo');
  });
});
