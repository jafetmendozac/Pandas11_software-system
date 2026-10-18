import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from 'fullcalendar';
import timeGridPlugin from 'fullcalendar/timegrid';
import dayGridPlugin from 'fullcalendar/daygrid';
import multiMonthPlugin from 'fullcalendar/multimonth';
import interactionPlugin from 'fullcalendar/interaction';
import themePlugin from 'fullcalendar/themes/classic';
import esLocale from 'fullcalendar/locales/es';
import { Temporal } from 'temporal-polyfill';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService, Client } from '../../shared/services/clientes.service';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';
import { EmpleadosService, Employee } from '../../shared/services/empleados.service';
import { ServiciosService, Service } from '../../shared/services/servicios.service';
import { TarifasService } from '../../shared/services/tarifas.service';
import { decimalLabel } from '../../shared/services/service-pricing.models';
import { workError, limaDateTime } from '../../shared/services/work-calendar.service';
import { Appointment, AppointmentStatus, DraftItem, ReservationAvailability, STATUS_LABELS, STAGE_LABELS, StageInput, addLocalMinutes, appointmentInput, draftItem, stageInputs } from '../../shared/services/appointment.models';
import { calendarAppearance } from './calendar-appearance';

@Component({selector:'app-calendario',standalone:true,imports:[FormsModule,FullCalendarModule,ModalComponent,PageBreadcrumbComponent],templateUrl:'./calendario.component.html'})
export class CalendarioComponent implements OnInit,OnDestroy {
 @ViewChild(FullCalendarComponent) private calendar?:FullCalendarComponent;
 readonly viewOptions=[{key:'dayGridMonth',label:'Mes'},{key:'multiMonthYear',label:'Año'},{key:'timeGridWeek',label:'Semana'},{key:'timeGridDay',label:'Día'}] as const;
 readonly calendarTitle=signal('');
 readonly currentView=signal('dayGridMonth');
 readonly authorization=inject(AuthorizationService);
 private readonly appointments=inject(AppointmentsService);
 private readonly clientService=inject(ClientesService);private readonly petService=inject(MascotasService);
 private readonly employeeService=inject(EmpleadosService);private readonly serviceCatalogue=inject(ServiciosService);private readonly pricing=inject(TarifasService);
 readonly clients=signal<Client[]>([]);readonly pets=signal<Pet[]>([]);readonly employees=signal<Employee[]>([]);readonly services=signal<Service[]>([]);
 readonly rows=signal<Appointment[]>([]);readonly loading=signal(false);readonly optionsLoading=signal(true);readonly error=signal('');
 readonly isOpen=signal(false);readonly detailLoading=signal(false);readonly detailFailed=signal(false);readonly pending=signal(false);readonly formError=signal('');
 readonly current=signal<Appointment|null>(null);readonly items=signal<DraftItem[]>([]);readonly checking=signal(false);
 readonly checks=signal<Record<string,ReservationAvailability>>({});readonly options=signal<CalendarOptions>({});
 readonly money=decimalLabel;readonly label=limaDateTime;readonly statuses=STATUS_LABELS;readonly stages=STAGE_LABELS;
 clientId='';notes='';internalNotes='';internalLoaded=false;cancelReason='';employeeFilter='';statusFilter:AppointmentStatus|''='';search='';
 private revision=0;private formRevision=0;private detailRevision=0;private rangeFrom='';private rangeUntil='';private suggestedStart='';
 get canEdit():boolean{return !this.detailFailed()&&this.authorization.has('appointments.manage')&&(!this.current()||this.current()?.status==='CONFIRMED');}
 async ngOnInit():Promise<void>{
  this.options.set({...calendarAppearance,plugins:[themePlugin,dayGridPlugin,multiMonthPlugin,timeGridPlugin,interactionPlugin],initialView:'dayGridMonth',locale:esLocale,timeZone:'America/Lima',direction:document.documentElement.dir==='rtl'?'rtl':'ltr',allDaySlot:false,
   headerToolbar:false,slotMinTime:'07:00:00',slotMaxTime:'24:00:00',height:'auto',
   selectable:this.authorization.has('appointments.manage'),editable:false,events:[],
   select:info=>this.openNew(info.startStr.includes('T')?info.startStr.slice(0,19):`${info.startStr}T07:00:00`),
   datesSet:info=>{this.calendarTitle.set(info.view.title);this.currentView.set(info.view.type);if(this.rangeFrom===info.startStr&&this.rangeUntil===info.endStr)return;this.rangeFrom=info.startStr;this.rangeUntil=info.endStr;void this.loadRange();},
   eventClick:info=>{const id=info.event.extendedProps['appointmentId'];if(typeof id==='string')void this.openAppointment(id);},
   eventContent:info=>{
    // Tarjetas TailAdmin con nombres no confiables siempre como texto, nunca HTML.
    const status=info.event.extendedProps?.['status'];
    const attention=info.event.extendedProps?.['needsAttention'];
    const tone=attention||status==='IN_PROGRESS'?'warning':status==='COMPLETED'?'success':status==='CANCELLED'||status==='NO_SHOW'?'danger':'primary';
    const palette={
     primary:{card:'border-brand-100 bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/15',dot:'bg-brand-500',text:'text-brand-700 dark:text-brand-400'},
     success:{card:'border-success-100 bg-success-50 dark:border-success-500/20 dark:bg-success-500/15',dot:'bg-success-500',text:'text-success-700 dark:text-success-400'},
     warning:{card:'border-orange-100 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/15',dot:'bg-orange-500',text:'text-orange-700 dark:text-orange-400'},
     danger:{card:'border-error-100 bg-error-50 dark:border-error-500/20 dark:bg-error-500/15',dot:'bg-error-500',text:'text-error-700 dark:text-error-400'},
    }[tone];
    const timed=info.view?.type.startsWith('timeGrid');
    const card=document.createElement('div');card.className=`event-fc-color flex w-full overflow-hidden rounded-lg border p-1.5 ${timed?'h-full flex-col':'items-center gap-2'} ${palette.card}`;
    card.title=info.event.title;
    const dot=document.createElement('span');dot.className=`h-2 w-2 shrink-0 rounded-full ${palette.dot}`;dot.setAttribute('aria-hidden','true');
    const title=document.createElement('span');title.className=`fc-event-title min-w-0 truncate text-xs font-medium ${palette.text}`;title.textContent=info.event.title;
    const line=document.createElement('div');line.className='flex min-w-0 items-center gap-1.5';line.append(dot,title);
    card.append(line);
    if(info.timeText){const time=document.createElement('span');time.className=`fc-event-time shrink-0 text-xs ${palette.text}`;time.textContent=info.timeText;card.append(time);}
    return {domNodes:[card]};
   }
  });
  try{
   const [clients,pets,employees,services]=await Promise.all([this.clientService.getAll(),this.petService.getAll(),this.employeeService.getAll(),this.serviceCatalogue.getAll()]);
   this.clients.set(clients);this.pets.set(pets.filter(p=>p.active&&!p.deleted_at&&!p.death_date));this.employees.set(employees.filter(e=>e.active&&e.profile_active));this.services.set(services.filter(s=>s.active));
  }catch(error){this.error.set(workError(error));}finally{this.optionsLoading.set(false);}
 }
 navigate(direction:'prev'|'next'|'today'):void{this.calendar?.getApi()[direction]();}
 changeView(view:string):void{if(this.viewOptions.some(option=>option.key===view))this.calendar?.getApi().changeView(view);}
 ngOnDestroy():void{this.revision++;this.formRevision++;this.detailRevision++;}
 async loadRange():Promise<void>{
  if(!this.rangeFrom||!this.rangeUntil)return;const revision=++this.revision;this.loading.set(true);this.error.set('');
  try{const rows=await this.appointments.range(this.rangeFrom,this.rangeUntil,this.employeeFilter||null,this.statusFilter||null,this.search);if(revision===this.revision){this.rows.set(rows);this.refreshEvents();}}
  catch(error){if(revision===this.revision)this.error.set(workError(error));}finally{if(revision===this.revision)this.loading.set(false);}
 }
 private refreshEvents():void{
  const events:EventInput[]=[];
  for(const a of this.rows())for(const i of a.items)for(const s of i.stages){
   if(this.employeeFilter&&s.employee_id!==this.employeeFilter)continue;
   events.push({id:s.id,start:s.starts_at,end:s.ends_at,title:`${i.pet_name} · ${i.service_name} · ${this.stages[s.stage]} · ${s.employee_name} · ${a.client_name} (${this.statuses[a.status]})${a.needs_attention?' — Revisar disponibilidad':''}`,extendedProps:{appointmentId:a.id,status:a.status,needsAttention:a.needs_attention},classNames:a.status==='CANCELLED'||a.status==='NO_SHOW'?['opacity-50']:[]});
  }
  this.options.update(o=>({...o,events}));
 }
 private nextStart():string{
  let time=Temporal.Now.zonedDateTimeISO('America/Lima').toPlainDateTime().round({smallestUnit:'hour',roundingMode:'ceil'});
  if(time.hour<7)time=time.with({hour:7});
  if(time.hour>17)time=time.add({days:1}).with({hour:7});
  if(time.dayOfWeek===7)time=time.add({days:1});
  return time.toString({smallestUnit:'second'});
 }
 openNew(start?:string):void{
  if(!this.authorization.has('appointments.manage')||this.pending()||this.optionsLoading())return;
  this.detailRevision++;this.detailFailed.set(false);this.current.set(null);this.clientId='';this.notes='';this.internalNotes='';this.internalLoaded=false;this.cancelReason='';this.items.set([]);this.suggestedStart=start||this.nextStart();this.touch();this.isOpen.set(true);
 }
 async openAppointment(id:string):Promise<void>{
  if(this.pending())return;const revision=++this.detailRevision;this.formRevision++;this.checking.set(false);this.checks.set({});this.detailFailed.set(false);this.clientId='';this.notes='';this.internalNotes='';this.detailLoading.set(true);this.formError.set('');this.isOpen.set(true);this.current.set(null);this.items.set([]);this.internalLoaded=false;
  try{
   const a=await this.appointments.get(id);if(revision!==this.detailRevision)return;
   this.current.set(a);this.clientId=a.client_id;this.notes=a.client_notes??'';this.cancelReason='';this.items.set(a.items.map(draftItem));this.checks.set({});
   if(this.authorization.has('appointment_internal.read')){const note=await this.appointments.internal(id);if(revision===this.detailRevision){this.internalNotes=note?.notes??'';this.internalLoaded=true;}}
  }catch(error){if(revision===this.detailRevision){this.detailFailed.set(true);this.formError.set(workError(error));}}finally{if(revision===this.detailRevision)this.detailLoading.set(false);}
 }
 close():void{if(this.pending())return;this.detailRevision++;this.formRevision++;this.isOpen.set(false);this.checking.set(false);}
 touch():void{this.formRevision++;this.formError.set('');this.checks.set({});this.checking.set(false);this.items.update(rows=>[...rows]);}
 changeClient():void{this.items.set([]);this.touch();}
 filteredPets():Pet[]{return this.pets().filter(p=>p.client_id===this.clientId);}
 addItem():void{
  if(!this.canEdit||!this.clientId)return;
  this.items.update(rows=>[...rows,{key:crypto.randomUUID(),pet_id:'',service_id:'',pet_name:'',service_name:'',price:'0',duration_minutes:0,specialist:false,notes:'',weight_kg_at_visit:null,start:this.suggestedStart||this.nextStart(),stages:[{stage:'SERVICE',employee_id:'',minutes:null}],quoting:false,quoteRevision:0}]);this.touch();
 }
 removeItem(key:string):void{if(!this.canEdit)return;this.items.update(rows=>rows.filter(i=>i.key!==key));this.touch();}
 async quote(item:DraftItem):Promise<void>{
  if(item.id||!this.canEdit)return;const token=++item.quoteRevision;this.touch();item.duration_minutes=0;item.quoting=true;this.items.update(rows=>[...rows]);
  const pet=this.pets().find(p=>p.id===item.pet_id),service=this.services().find(s=>s.id===item.service_id);
  if(!pet||!service){item.quoting=false;this.items.update(rows=>[...rows]);return;}
  try{
   const q=await this.pricing.quote(service.id,pet.pet_size,pet.pet_coat_type);
   if(item.quoteRevision!==token||!this.items().includes(item))return;
   item.price=q.price;item.duration_minutes=q.duration_minutes;item.specialist=service.requires_specialist;item.pet_name=pet.name;item.service_name=service.name;
   item.stages=[{stage:'SERVICE',employee_id:'',minutes:q.duration_minutes}];
  }catch(error){if(item.quoteRevision===token&&this.items().includes(item))this.formError.set(workError(error));}
  finally{if(item.quoteRevision===token&&this.items().includes(item)){item.quoting=false;this.items.update(rows=>[...rows]);}}
 }
 split(item:DraftItem,enabled:boolean):void{
  if(!this.canEdit)return;
  item.stages=enabled?[{stage:'BATH',employee_id:'',minutes:null},{stage:'CUT',employee_id:'',minutes:null}]:[{stage:'SERVICE',employee_id:'',minutes:item.duration_minutes}];this.touch();
 }
 interval(item:DraftItem,index:number):StageInput|null{
  try{
   let cursor=item.start;
   for(let n=0;n<=index;n++){
    const s=item.stages[n];if(s.minutes===null||!Number.isInteger(s.minutes)||s.minutes<=0)return null;
    const end=addLocalMinutes(cursor,s.minutes);
    if(n===index)return {stage:s.stage,employee_id:s.employee_id,starts_local:cursor,ends_local:end};cursor=end;
   }
  }catch{return null;}return null;
 }
 continuation(item:DraftItem,index:number):boolean{return index>0||this.items().some(i=>i!==item&&i.pet_id===item.pet_id&&i.start<item.start);}
 candidates(item:DraftItem,index:number):Employee[]{
  const specialist=item.stages[index].stage==='CUT'||(item.stages[index].stage==='SERVICE'&&item.specialist);
  return this.employees().filter(e=>!specialist||e.skill_level==='ALL_SERVICES');
 }
 assignedName(item:DraftItem,index:number):string{return this.current()?.items.find(i=>i.id===item.id)?.stages.find(s=>s.stage===item.stages[index].stage)?.employee_name??'Trabajador no habilitado';}
 checkKey(item:DraftItem,index:number,employeeId:string):string{return `${item.key}:${index}:${employeeId}`;}
 availabilityLabel(item:DraftItem,index:number,id:string):string{
  const r=this.checks()[this.checkKey(item,index,id)];return !r?'Sin verificar':r.can_start_service?'Horario habilitado':'No habilitado';
 }
 unavailable(item:DraftItem,index:number,id:string):boolean{const r=this.checks()[this.checkKey(item,index,id)];return !!r&&!r.can_start_service;}
 async checkAvailability():Promise<void>{
  const revision=this.formRevision;this.checking.set(true);this.formError.set('');const result:Record<string,ReservationAvailability>={};
  try{
   await Promise.all(this.items().flatMap(item=>item.stages.flatMap((s,index)=>{
    const interval=this.interval(item,index);if(!interval)throw new Error('Completa fechas y minutos para consultar disponibilidad.');
    return this.candidates(item,index).map(async employee=>{result[this.checkKey(item,index,employee.id)]=await this.appointments.availability({...interval,employee_id:employee.id},s.stage==='CUT'||(s.stage==='SERVICE'&&item.specialist),this.current()?.id??null,this.continuation(item,index));});
   })));
   if(revision===this.formRevision)this.checks.set(result);
  }catch(error){if(revision===this.formRevision)this.formError.set(workError(error));}finally{if(revision===this.formRevision)this.checking.set(false);}
 }
 async save():Promise<void>{
  if(!this.canEdit||this.pending()||this.detailLoading())return;
  this.formError.set('');
  try{
   const payload=appointmentInput(this.clientId,this.notes,this.items());this.pending.set(true);
   const wasNew=!this.current();const a=await this.appointments.save(payload,this.current());if(wasNew){this.internalLoaded=this.authorization.has('appointment_internal.read');this.internalNotes='';}this.current.set(a);this.items.set(a.items.map(draftItem));this.formRevision++;this.checks.set({});await this.loadRange();
  }catch(error){this.formError.set(workError(error));}finally{this.pending.set(false);}
 }
 async transition(target:AppointmentStatus):Promise<void>{
  const a=this.current();if(!a||this.pending()||!this.authorization.has(target==='CANCELLED'?'appointments.cancel':'appointments.status'))return;
  this.formError.set('');this.pending.set(true);
  try{const saved=await this.appointments.transition(a,target,this.cancelReason);this.current.set(saved);this.items.set(saved.items.map(draftItem));this.notes=saved.client_notes??'';this.formRevision++;this.checks.set({});await this.loadRange();}
  catch(error){this.formError.set(workError(error));}finally{this.pending.set(false);}
 }
 async saveInternal():Promise<void>{
  const a=this.current();if(!a||this.pending()||!this.internalLoaded||!this.authorization.has('appointment_internal.manage'))return;
  this.formError.set('');this.pending.set(true);
  try{this.current.set(await this.appointments.saveInternal(a,this.internalNotes));await this.loadRange();}
  catch(error){this.formError.set(workError(error));}finally{this.pending.set(false);}
 }
}
