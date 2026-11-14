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
const appointment:Appointment={id:'a',client_id:'c',client_name:'Cliente',starts_at:'2030-07-29T13:00:00Z',ends_at:'2030-07-29T14:00:00Z',version:1,total_price:'50.25',deposit_required:'0',pickup_fee:'0',pickup_type:'NONE',source:'INTERNAL',status:'CONFIRMED',client_notes:'nota pública',cancel_reason:null,created_by:'owner',needs_attention:false,items:[{id:'i',pet_id:'pet',pet_name:'<img src=x onerror=alert(1)>',service_id:'service',service_name:'Baño',price:'50.25',duration_minutes:60,requires_specialist_snapshot:false,notes:null,weight_kg_at_visit:null,stages:[{id:'stage',item_id:'i',stage:'SERVICE',employee_id:'e',employee_name:'Empleado',starts_at:'2030-07-29T13:00:00Z',ends_at:'2030-07-29T14:00:00Z'}]}]};
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
 it('espera a terminar las cotizaciones antes de consultar disponibilidad',async()=>{
  const f=await fixture();const c=f.componentInstance;const item=draft();item.quoting=true;c.items.set([item]);
  await c.checkAvailability();expect(api.availability).not.toHaveBeenCalled();expect(c.checking()).toBeFalse();
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
  expect((f.nativeElement.querySelector('button[aria-label="Vista del calendario"]') as HTMLButtonElement).textContent?.trim()).toBe('Semana');
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

 it('permite cambiar vista y filtros con los selectores compartidos',async()=>{
  const f=await fixture();const c=f.componentInstance;
  const choose=(label:string,option:string)=>{
   const trigger=f.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
   expect(trigger).not.toBeNull();trigger.click();f.detectChanges();
   const list=trigger.closest('app-custom-select');
   const choice=Array.from(list?.querySelectorAll<HTMLButtonElement>('button[role="option"]')??[]).find(button=>button.textContent?.trim()===option);
   expect(choice).toBeDefined();choice!.click();f.detectChanges();
  };
  choose('Vista del calendario','Día');
  expect(c.currentView()).toBe('timeGridDay');
  choose('Filtrar por empleado','Empleado');
  expect(c.employeeFilter).toBe('e');expect(api.range.calls.mostRecent().args[2]).toBe('e');
  choose('Filtrar por estado','Confirmada');
  expect(c.statusFilter).toBe('CONFIRMED');expect(api.range.calls.mostRecent().args[3]).toBe('CONFIRMED');
  choose('Filtrar por empleado','Todos');choose('Filtrar por estado','Todos');
  expect(c.employeeFilter).toBe('');expect(c.statusFilter).toBe('');
  expect(api.range.calls.mostRecent().args[2]).toBeNull();expect(api.range.calls.mostRecent().args[3]).toBeNull();
 });

 for(const status of ['COMPLETED','CANCELLED'] as const){
  it(`consulta una cita pasada ${status} desde el calendario y conserva su detalle sin editarla`,async()=>{
   const historical:Appointment={...appointment,status,starts_at:'2020-07-28T13:00:00Z',ends_at:'2020-07-28T14:00:00Z',cancel_reason:status==='CANCELLED'?'Cancelación sintética de aceptación':null,
    items:[{...appointment.items[0],stages:[{...appointment.items[0].stages[0],starts_at:'2020-07-28T13:00:00Z',ends_at:'2020-07-28T14:00:00Z'}]}]};
   api.range.and.resolveTo([historical]);api.get.and.resolveTo(historical);
   const f=await fixture();const c=f.componentInstance;
   const calendar=f.debugElement.query(By.directive(FullCalendarComponent)).componentInstance as FullCalendarComponent;
   c.statusFilter=status;calendar.getApi().gotoDate('2020-07-28');
   for(let n=0;n<10;n++)await Promise.resolve();f.detectChanges();
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));f.detectChanges();
   expect(api.range.calls.mostRecent().args[3]).toBe(status);
   expect(f.nativeElement.querySelector('full-calendar').textContent).toContain(c.statuses[status]);
   const event=f.nativeElement.querySelector('full-calendar .event-fc-color') as HTMLElement;
   expect(event).not.toBeNull();event.click();
   for(let n=0;n<10;n++)await Promise.resolve();f.detectChanges();
   expect(c.current()).toEqual(historical);expect(c.canEdit).toBeFalse();
   expect(c.items()[0].price).toBe('50.25');expect(c.items()[0].duration_minutes).toBe(60);
   expect(c.items()[0].stages[0].employee_id).toBe('e');
   if(status==='CANCELLED')expect(f.nativeElement.textContent).toContain(historical.cancel_reason);
   await c.save();expect(api.save).not.toHaveBeenCalled();
   c.close();await c.openAppointment(historical.id);f.detectChanges();
   expect(c.current()).toEqual(historical);expect(api.get).toHaveBeenCalledTimes(2);
  });
 }

 it('seleccionar un día sin hora en mes conserva una fecha local válida para el formulario',async()=>{
  const f=await fixture();const calendar=f.debugElement.query(By.directive(FullCalendarComponent)).componentInstance as FullCalendarComponent;
  calendar.getApi().select('2030-07-29','2030-07-30');f.detectChanges();
  expect(f.componentInstance.isOpen()).toBeTrue();
  f.componentInstance.clientId='c';f.componentInstance.addItem();
  expect(f.componentInstance.items()[0].start).toBe('2030-07-29T07:00:00');
 });

 it('una cotización fallida de un servicio retirado no contamina el nuevo formulario',async()=>{
  const f=await fixture();const c=f.componentInstance;const i=draft();c.items.set([i]);
  c.pets.set([{id:'pet',client_id:'c',pet_size:'TOY',breed_id:'00000000-0000-4000-8000-000000000001',name:'Perro'} as never]);
  c.services.set([{id:'service',name:'Baño',requires_specialist:false} as never]);
  let reject!:(error:Error)=>void;spyOn(TestBed.inject(TarifasService),'quote').and.callFake(()=>new Promise((_resolve,r)=>reject=r));
  const previous=c.quote(i);c.items.set([]);c.touch();reject(new Error('Cotización anterior denegada'));await previous;
  expect(c.formError()).toBe('');expect(c.items()).toEqual([]);
 });

 it('selecciona dos servicios en una sola tarjeta y envía ambos para la misma mascota',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew('2030-07-29T08:00:00');
  c.pets.set([{id:'pet',client_id:'c',name:'Perro',pet_size:'TOY',breed_id:null} as never]);
  c.services.set([{id:'service',name:'Baño',requires_specialist:false},{id:'corte',name:'Corte',requires_specialist:false}] as never);
  spyOn(TestBed.inject(TarifasService),'quote').and.callFake(async(id:string)=>({price:'50.25',duration_minutes:id==='service'?60:30} as never));
  c.setClient('c');
  expect(c.petGroups().length).toBe(1);expect(c.items()[0].start).toBe('2030-07-29T08:00:00');
  c.addItem();expect(c.petGroups().length).toBe(1);
  c.setGroupPet(c.petGroups()[0],'pet');f.detectChanges();
  const root=f.nativeElement as HTMLElement;const trigger=root.querySelector<HTMLButtonElement>('button[aria-label="Servicios para Perro"]');
  expect(trigger).not.toBeNull();trigger!.click();f.detectChanges();
  trigger!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));f.detectChanges();
  expect(c.isOpen()).toBeTrue();expect(trigger!.getAttribute('aria-expanded')).toBe('false');
  trigger!.click();f.detectChanges();
  const choose=(name:string)=>{const options=Array.from(root.querySelectorAll<HTMLButtonElement>('app-multi-select button[role="option"]'));const choice=options.find(button=>button.textContent?.trim()===name);expect(choice).toBeDefined();choice!.click();f.detectChanges();};
  choose('Baño');choose('Corte');
  for(let n=0;n<8;n++)await Promise.resolve();f.detectChanges();
  expect(root.querySelectorAll('form fieldset > section').length).toBe(1);
  expect(c.items().map(item=>item.pet_id)).toEqual(['pet','pet']);
  expect(c.items()[1].start).toBe('2030-07-29T09:00:00');
  c.setGroupEmployee(c.petGroups()[0],'e');
  expect(c.items().every(item=>item.stages[0].employee_id==='e')).toBeTrue();
  await c.save();
  const saved=api.save.calls.mostRecent().args[0];
  expect(saved.items.map((item:{service_id:string})=>item.service_id)).toEqual(['service','corte']);
  expect(saved.items[1].stages[0].starts_local).toBe('2030-07-29T09:00:00');
 });

 it('reinicia una sola tarjeta al cambiar de cliente',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew('2030-07-29T08:00:00');
  c.setClient('c');expect(c.items().length).toBe(1);expect(c.petGroups().length).toBe(1);
  c.setClient('');expect(c.items()).toEqual([]);
  c.setClient('c');expect(c.items().length).toBe(1);expect(c.petGroups().length).toBe(1);
 });

 it('espera la duración anterior aunque las cotizaciones terminen en distinto orden',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew('2030-07-29T08:00:00');c.clientId='c';
  c.pets.set([{id:'pet',client_id:'c',name:'Perro',pet_size:'TOY',breed_id:null} as never]);
  c.services.set([{id:'service',name:'Baño',requires_specialist:false},{id:'corte',name:'Corte',requires_specialist:false}] as never);
  const resolvers:Record<string,(result:never)=>void>={};
  spyOn(TestBed.inject(TarifasService),'quote').and.callFake((id:string)=>new Promise(resolve=>{resolvers[id]=resolve;}));
  c.addItem();c.setGroupPet(c.petGroups()[0],'pet');
  c.setGroupServices(c.petGroups()[0],['service']);c.setGroupServices(c.petGroups()[0],['service','corte']);
  resolvers['corte']({price:'20',duration_minutes:30} as never);for(let n=0;n<4;n++)await Promise.resolve();
  expect(c.items()[1].start).toBe('');
  resolvers['service']({price:'50',duration_minutes:60} as never);for(let n=0;n<4;n++)await Promise.resolve();
  expect(c.items()[1].start).toBe('2030-07-29T09:00:00');
  c.setItemTime(c.items()[0],'10:00:00');expect(c.items()[1].start).toBe('2030-07-29T11:00:00');
  c.setItemTime(c.items()[1],'12:00:00');c.setItemTime(c.items()[0],'09:00:00');
  expect(c.items()[1].start).toBe('2030-07-29T10:00:00');
 });

 it('mantiene una sola mascota y permite varios servicios para ella',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew();c.clientId='c';
  const first=draft();const second={...draft(),key:'other',service_id:'corte',service_name:'Corte',id:'item-2',price:'73.25'};
  c.items.set([{...first,id:'item-1'},second]);f.detectChanges();
  expect(c.petGroups().length).toBe(1);expect(c.selectedServices(c.petGroups()[0])).toEqual(['service','corte']);
  c.addItem();f.detectChanges();expect(c.petGroups().length).toBe(1);
  expect((f.nativeElement as HTMLElement).textContent).not.toContain('Añadir mascota');
 });

 it('recupera el servicio guardado y su tarifa al desmarcarlo y volverlo a marcar',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew();c.clientId='c';
  const saved={...draft(),id:'item-1',price:'73.25'};
  const existing={...appointment,items:[{...appointment.items[0],id:'item-1',price:'73.25'}]};
  c.current.set(existing);c.items.set([saved]);c.services.set([]);
  const quote=spyOn(TestBed.inject(TarifasService),'quote');
  c.setGroupServices(c.petGroups()[0],[]);
  expect(c.items()[0].service_id).toBe('');
  expect(c.serviceOptions(c.petGroups()[0]).map(option=>option.value)).toContain('service');
  c.setGroupServices(c.petGroups()[0],['service']);
  expect(c.items()[0].id).toBe('item-1');expect(c.items()[0].price).toBe('73.25');
  expect(quote).not.toHaveBeenCalled();
  await c.save();expect(api.save.calls.mostRecent().args[0].items[0].id).toBe('item-1');
  expect(api.save.calls.mostRecent().args[1]).toBe(existing);
 });

 it('conserva una cita histórica con varias mascotas en modo no reprogramable',async()=>{
  const second={...appointment.items[0],id:'i-2',pet_id:'pet-2',pet_name:'Otro perro',stages:[{...appointment.items[0].stages[0],id:'stage-2',item_id:'i-2'}]};
  const historical={...appointment,items:[appointment.items[0],second]};
  api.get.and.resolveTo(historical);
  const f=await fixture();const c=f.componentInstance;await c.openAppointment('a');f.detectChanges();
  expect(c.historicalMultiPet).toBeTrue();expect(c.canEdit).toBeFalse();expect(c.items().length).toBe(2);
  expect((f.nativeElement as HTMLElement).textContent).toContain('cita histórica contiene varias mascotas');
  expect((f.nativeElement as HTMLElement).textContent).toContain('Cancelar reserva');
  await c.save();expect(api.save).not.toHaveBeenCalled();
 });

 it('sincroniza los selectores de fecha y hora con el valor de Lima incluyendo segundos',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew();c.clientId='c';const i=draft();i.start='2030-07-29T08:15:27';c.items.set([i]);f.detectChanges();
  const date=f.nativeElement.querySelector('#date-key') as HTMLInputElement;
  const time=f.nativeElement.querySelector('#time-key') as HTMLInputElement;
  expect(date.value).toBe('2030-07-29');expect(time.value).toBe('08:15:27');
  const datePicker=(date as HTMLInputElement & {_flatpickr:{setDate:(value:string,trigger:boolean)=>void}})._flatpickr;
  const timePicker=(time as HTMLInputElement & {_flatpickr:{setDate:(value:string,trigger:boolean)=>void}})._flatpickr;
  datePicker.setDate('2030-07-30',true);timePicker.setDate('09:20:35',true);f.detectChanges();
  expect(i.start).toBe('2030-07-30T09:20:35');expect(date.value).toBe('2030-07-30');expect(time.value).toBe('09:20:35');
 });

 it('abre los selectores de fecha y hora por encima del modal',async()=>{
  const f=await fixture();const c=f.componentInstance;c.openNew();c.clientId='c';c.items.set([draft()]);f.detectChanges();
  const date=f.nativeElement.querySelector('#date-key') as HTMLInputElement;
  const time=f.nativeElement.querySelector('#time-key') as HTMLInputElement;
  date.click();
  const datePopup=document.querySelector<HTMLElement>('.flatpickr-calendar.open');
  expect(datePopup).not.toBeNull();
  expect(Number(getComputedStyle(datePopup!).zIndex)).toBeGreaterThan(99999);
  time.click();
  const timePopup=document.querySelector<HTMLElement>('.flatpickr-calendar.open');
  expect(timePopup).not.toBeNull();
  expect(Number(getComputedStyle(timePopup!).zIndex)).toBeGreaterThan(99999);
  c.pending.set(true);f.detectChanges();
  expect(document.querySelector('.flatpickr-calendar.open')).toBeNull();
 });

});
