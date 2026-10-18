import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { provideRouter } from '@angular/router';
import { CalendarioComponent } from './calendario.component';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService } from '../../shared/services/clientes.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { EmpleadosService } from '../../shared/services/empleados.service';
import { ServiciosService } from '../../shared/services/servicios.service';
import { TarifasService } from '../../shared/services/tarifas.service';
import { Appointment, DraftItem, ReservationAvailability } from '../../shared/services/appointment.models';
const draft=():DraftItem=>({key:'key',pet_id:'pet',service_id:'service',pet_name:'Perro',service_name:'Baño',price:'50.25',duration_minutes:60,specialist:false,notes:'',weight_kg_at_visit:null,start:'2030-07-29T08:00',stages:[{stage:'SERVICE',employee_id:'e',minutes:60}],quoting:false,quoteRevision:0});
const appointment:Appointment={id:'a',client_id:'c',client_name:'Cliente',starts_at:'2030-07-29T13:00:00Z',ends_at:'2030-07-29T14:00:00Z',version:1,total_price:'50.25',deposit_required:'0',pickup_fee:'0',source:'INTERNAL',status:'CONFIRMED',client_notes:'nota pública',cancel_reason:null,created_by:'owner',needs_attention:false,items:[{id:'i',pet_id:'pet',pet_name:'<img src=x onerror=alert(1)>',service_id:'service',service_name:'Baño',price:'50.25',duration_minutes:60,requires_specialist_snapshot:false,notes:null,weight_kg_at_visit:null,stages:[{id:'stage',item_id:'i',stage:'SERVICE',employee_id:'e',employee_name:'Empleado',starts_at:'2030-07-29T13:00:00Z',ends_at:'2030-07-29T14:00:00Z'}]}]};
describe('Agenda interna: permisos, formulario y concurrencia visual',()=>{
 let api:{range:jasmine.Spy;get:jasmine.Spy;save:jasmine.Spy;availability:jasmine.Spy;internal:jasmine.Spy;transition:jasmine.Spy;saveInternal:jasmine.Spy};let auth:{has:jasmine.Spy};
 beforeEach(()=>{
  api={range:jasmine.createSpy().and.resolveTo([]),get:jasmine.createSpy().and.resolveTo(appointment),save:jasmine.createSpy().and.resolveTo(appointment),availability:jasmine.createSpy().and.resolveTo({can_start_service:true,interval_covered:true,reasons:[]}),internal:jasmine.createSpy().and.resolveTo({notes:'Privado'}),transition:jasmine.createSpy(),saveInternal:jasmine.createSpy()};auth={has:jasmine.createSpy().and.returnValue(true)};
  TestBed.configureTestingModule({imports:[CalendarioComponent],providers:[provideRouter([]),{provide:AppointmentsService,useValue:api},{provide:AuthorizationService,useValue:auth},{provide:ClientesService,useValue:{getAll:async()=>[{id:'c',first_name:'Cliente'}]}},{provide:MascotasService,useValue:{getAll:async()=>[]}},{provide:EmpleadosService,useValue:{getAll:async()=>[{id:'e',employee_name:'Empleado',active:true,profile_active:true,skill_level:'ALL_SERVICES'}]}},{provide:ServiciosService,useValue:{getAll:async()=>[]}},{provide:TarifasService,useValue:{quote:async()=>({})}}]});
 });
 const fixture=async()=>{const f=TestBed.createComponent(CalendarioComponent);f.detectChanges();for(let n=0;n<10&&f.componentInstance.optionsLoading();n++)await Promise.resolve();f.detectChanges();expect(f.componentInstance.optionsLoading()).toBeFalse();return f;};
 it('STAFF consulta pero no tiene acciones de escritura ni puede ejecutar callbacks',async()=>{
  auth.has.and.callFake((p:string)=>p.endsWith('.read'));
  const f=await fixture();await f.componentInstance.openAppointment('a');f.detectChanges();await Promise.resolve();f.detectChanges();
  expect(f.componentInstance.canEdit).toBeFalse();expect(f.nativeElement.textContent).not.toContain('Guardar cita');expect((f.nativeElement.querySelectorAll('textarea')[1] as HTMLTextAreaElement).value).toBe('Privado');
  expect(f.nativeElement.textContent).not.toContain('Añadir cita +');
  expect((f.nativeElement.querySelectorAll('textarea')[1] as HTMLTextAreaElement).readOnly).toBeTrue();
  await f.componentInstance.save();await f.componentInstance.transition('CANCELLED');await f.componentInstance.saveInternal();expect(api.save).not.toHaveBeenCalled();expect(api.transition).not.toHaveBeenCalled();expect(api.saveInternal).not.toHaveBeenCalled();
 });
 it('mantiene el formulario ante rechazo de solapamiento y evita doble envío',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew();c.clientId='c';c.items.set([draft()]);api.save.and.rejectWith(new Error('Empleado ocupado'));
  await c.save();expect(c.isOpen()).toBeTrue();expect(c.items()[0].start).toBe('2030-07-29T08:00');expect(c.formError()).toBe('Empleado ocupado');
  let finish!:(a:Appointment)=>void;api.save.and.callFake(()=>new Promise(r=>finish=r));const pending=c.save();await c.save();expect(api.save).toHaveBeenCalledTimes(2);finish(appointment);await pending;
  expect(c.internalLoaded).toBeTrue();
 });
 it('descarta una comprobación antigua si cambian los tiempos',async()=>{
  const f=await fixture();const c=f.componentInstance;c.items.set([draft()]);let resolve!:(r:ReservationAvailability)=>void;api.availability.and.callFake(()=>new Promise(r=>resolve=r));
  const pending=c.checkAvailability();c.items()[0].start='2030-07-29T12:00';c.touch();resolve({can_start_service:true,interval_covered:true,reasons:[],windows:[],notice:''});await pending;
  expect(c.checks()).toEqual({});expect(c.checking()).toBeFalse();
 });
 it('carga etapas históricas y notas separadas; no publica HTML en títulos del calendario',async()=>{
  const f=await fixture();const c=f.componentInstance;await c.openAppointment('a');f.detectChanges();
  expect(c.items()[0].id).toBe('i');expect(c.internalNotes).toBe('Privado');
  expect(f.nativeElement.querySelector('img[src="x"]')).toBeNull();
  const renderer=c.options().eventContent as (arg:unknown)=>{domNodes:HTMLElement[]};const result=renderer({event:{title:'<img src=x onerror=alert(1)>'}});
  expect(result.domNodes[0].querySelector('img')).toBeNull();expect(result.domNodes[0].textContent).toContain('<img');
  expect(c.options().timeZone).toBe('America/Lima');expect(c.options().slotMaxTime).toBe('24:00:00');
 });
 it('una carga de ficha fallida no se convierte en un alta con datos anteriores',async()=>{
  const f=await fixture();api.get.and.rejectWith(new Error('Cita inexistente'));await f.componentInstance.openAppointment('missing');
  expect(f.componentInstance.canEdit).toBeFalse();expect(f.componentInstance.clientId).toBe('');expect(f.componentInstance.formError()).toBe('Cita inexistente');
 });
 it('solo ofrece especialista para corte y no inventa reparto al activar relevo',async()=>{
  const f=await fixture();const c=f.componentInstance;const i=draft();i.specialist=true;i.duration_minutes=120;c.items.set([i]);c.split(i,true);
  expect(i.stages.map(s=>s.minutes)).toEqual([null,null]);
  c.employees.set([{id:'assistant',skill_level:'ASSISTANT'} as never,{id:'specialist',skill_level:'ALL_SERVICES'} as never]);
  expect(c.candidates(i,1).map(e=>e.id)).toEqual(['specialist']);expect(c.candidates(i,0).length).toBe(2);
 });
 it('navega las vistas de plantilla con FullCalendar real y conserva etapas después18 sin recargas repetidas',async()=>{
  const late={...appointment,starts_at:'2030-07-29T23:00:00Z',ends_at:'2030-07-30T00:00:00Z',items:[{...appointment.items[0],stages:[{...appointment.items[0].stages[0],starts_at:'2030-07-29T23:00:00Z',ends_at:'2030-07-30T00:00:00Z'}]}]};
  api.range.and.resolveTo([late]);const f=await fixture();
  const calendar=f.debugElement.query(By.directive(FullCalendarComponent)).componentInstance as FullCalendarComponent;
  const c=f.componentInstance;
  expect(calendar.getApi().view.type).toBe('dayGridMonth');
  c.changeView('multiMonthYear');f.detectChanges();
  expect(calendar.getApi().view.type).toBe('multiMonthYear');
  c.changeView('timeGridDay');f.detectChanges();
  expect(calendar.getApi().view.type).toBe('timeGridDay');
  c.changeView('timeGridWeek');calendar.getApi().gotoDate('2030-07-29');
  for(let n=0;n<10;n++)await Promise.resolve();f.detectChanges();
  await Promise.resolve();f.detectChanges();
  expect(c.calendarTitle()).toBe(calendar.getApi().view.title);
  expect((f.nativeElement.querySelector('#agenda-view') as HTMLSelectElement).value).toBe('timeGridWeek');
  const requests=api.range.calls.count();
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));f.detectChanges();
  expect(f.nativeElement.querySelector('full-calendar').textContent).toContain('<img src=x onerror=alert(1)>');
  expect(f.nativeElement.querySelector('full-calendar img')).toBeNull();
  expect(f.nativeElement.querySelector('full-calendar .event-fc-color')).not.toBeNull();
  expect(api.range.calls.count()).toBe(requests);
  (f.nativeElement.querySelector('full-calendar .event-fc-color') as HTMLElement).click();
  await Promise.resolve();expect(api.get).toHaveBeenCalledWith('a');
  c.close();const oldStart=calendar.getApi().view.activeStart;
  c.navigate('next');expect(calendar.getApi().view.activeStart).not.toEqual(oldStart);
  c.navigate('prev');expect(calendar.getApi().view.activeStart).toEqual(oldStart);
 });

 it('seleccionar un día sin hora en mes conserva una fecha local válida para el formulario',async()=>{
  const f=await fixture();const calendar=f.debugElement.query(By.directive(FullCalendarComponent)).componentInstance as FullCalendarComponent;
  calendar.getApi().select('2030-07-29','2030-07-30');f.detectChanges();
  expect(f.componentInstance.isOpen()).toBeTrue();
  f.componentInstance.clientId='c';f.componentInstance.addItem();
  expect(f.componentInstance.items()[0].start).toBe('2030-07-29T07:00:00');
 });

 it('una cotización fallida de un servicio retirado no contamina el nuevo formulario',async()=>{
  const f=await fixture();const c=f.componentInstance;const i=draft();c.items.set([i]);
  c.pets.set([{id:'pet',client_id:'c',pet_size:'TOY',pet_coat_type:'LONG',name:'Perro'} as never]);
  c.services.set([{id:'service',name:'Baño',requires_specialist:false} as never]);
  let reject!:(error:Error)=>void;spyOn(TestBed.inject(TarifasService),'quote').and.callFake(()=>new Promise((_resolve,r)=>reject=r));
  const previous=c.quote(i);c.items.set([]);c.touch();reject(new Error('Cotización anterior denegada'));await previous;
  expect(c.formError()).toBe('');expect(c.items()).toEqual([]);
 });

});
