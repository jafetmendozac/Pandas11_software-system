import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmpleadosComponent } from './empleados.component';
import { EmpleadosService } from '../../shared/services/empleados.service';
import { WorkCalendarService } from '../../shared/services/work-calendar.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
describe('Empleados: permisos y persistencia',()=>{
  let employees:{search:jasmine.Spy;eligibleProfiles:jasmine.Spy;create:jasmine.Spy;update:jasmine.Spy};
  let authorization:{has:jasmine.Spy};
  beforeEach(()=>{
    employees={search:jasmine.createSpy().and.resolveTo({rows:[],total:0}),eligibleProfiles:jasmine.createSpy().and.resolveTo([{id:'p',first_name:'Nombre',active:true}]),create:jasmine.createSpy().and.resolveTo(),update:jasmine.createSpy().and.resolveTo()};
    authorization={has:jasmine.createSpy().and.returnValue(true)};
    TestBed.configureTestingModule({imports:[EmpleadosComponent],providers:[provideRouter([]),{provide:EmpleadosService,useValue:employees},{provide:AuthorizationService,useValue:authorization},{provide:WorkCalendarService,useValue:{load:async()=>({schedules:[],business:[],blocks:[]})}}]});
  });
  it('STAFF carga nombres desde búsqueda operativa sin consultar perfiles globales',async()=>{
    authorization.has.and.callFake((p:string)=>p==='employees.read'||p==='schedules.read'||p==='time_blocks.read'||p==='availability.read');
    const f=TestBed.createComponent(EmpleadosComponent);f.detectChanges();await f.whenStable();f.detectChanges();
    expect(employees.eligibleProfiles).not.toHaveBeenCalled();
    expect(employees.search).toHaveBeenCalled();expect(f.componentInstance.table?.allowEdit).toBeFalse();
  });
  it('conserva formulario ante rechazo del empleado y fija perfil solo al crear',async()=>{
    const f=TestBed.createComponent(EmpleadosComponent);f.detectChanges();await f.whenStable();f.detectChanges();
    const table=f.componentInstance.table!;table.openCreateForm();
    table.formData={profile_id:'p',skill_level:'ASSISTANT',active:'true',phone:'123'};
    employees.create.and.rejectWith(new Error('Perfil ya asociado'));await table.saveRow();
    expect(table.isFormOpen).toBeTrue();expect(table.formData['phone']).toBe('123');expect(table.formError).toBe('Perfil ya asociado');
    table.openEditForm({id:'e',profile_id:'p'});expect(table.editableColumns.some(c=>c.key==='profile_id')).toBeFalse();
  });
  it('descarta páginas atrasadas tras una búsqueda nueva',async()=>{
    const c=TestBed.createComponent(EmpleadosComponent).componentInstance;
    let resolve!:(data:unknown)=>void;employees.search.and.callFake(()=>new Promise(r=>resolve=r));
    const previous=c.loadEmployees({search:'anterior',page:1,size:5});
    employees.search.and.resolveTo({rows:[],total:10});await c.loadEmployees({search:'nuevo',page:2,size:5});
    resolve({rows:[{id:'viejo'}],total:1});await previous;
    expect(c.total()).toBe(10);expect(c.tableData()).toEqual([]);
  });
});
