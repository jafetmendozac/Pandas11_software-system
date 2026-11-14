import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Employee, EmpleadosService } from '../../shared/services/empleados.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { profileLabel } from '../../shared/services/profiles.service';
import { PageQuery } from '../../shared/services/clientes.service';
import { WorkCalendarComponent } from '../../shared/components/employees/work-calendar/work-calendar.component';
import { workError, WorkCalendarService, WorkCalendar, WEEKDAYS } from '../../shared/services/work-calendar.service';
@Component({selector:'app-empleados',standalone:true,imports:[ComponentCardComponent,PageBreadcrumbComponent,PersonalizedTable,WorkCalendarComponent],templateUrl:'./empleados.component.html'})
export class EmpleadosComponent implements OnInit,OnDestroy {
  readonly authorization=inject(AuthorizationService);
  private readonly employees=inject(EmpleadosService);
  readonly calendar=inject(WorkCalendarService);
  @ViewChild('table') table?:PersonalizedTable;
  readonly tableData=signal<Employee[]>([]); readonly total=signal(0); readonly loading=signal(false); readonly errorMessage=signal('');
  readonly expandedRowId=signal<string|null>(null);
  readonly schedulesCache=signal<Record<string,WorkCalendar>>({});
  readonly profilesReady=signal(false);
  private query:PageQuery={search:'',page:1,size:10}; private revision=0;
  columns:TableColumn[]=[
    {key:'employee_name',label:'Nombre',editable:false},
    {key:'phone',label:'Teléfono',required:false},
    {key:'skill_level',label:'Habilidad',options:[{value:'ASSISTANT',label:'Asistente: baño'},{value:'ALL_SERVICES',label:'Baño y corte'}]},
    {key:'active',label:'Estado',options:[{value:'true',label:'Activo'},{value:'false',label:'Inactivo'}]},
    {key:'profile_active',label:'Cuenta activa',editable:false},
    {key:'profile_id',label:'Perfil vinculado',formOnly:true,editable:false,options:[{label:'Selecciona un perfil activo',value:''}],helpText:'Se fija al crear. No concede roles ni acceso al panel.'},
    {key:'horarios',label:'Horario',editable:false},
  ];
  readonly columnFormatters=computed(()=>{
    const cache=this.schedulesCache();
    return {
      horarios:(_value:unknown,item:TableRow)=>this.getHorarioSummary(item as Employee,cache),
    };
  });
  toggleRow(id:string):void{
    if(this.expandedRowId()===id){this.expandedRowId.set(null);return;}
    this.expandedRowId.set(id);
    if(!this.schedulesCache()[id]){
      this.calendar.load(id).then(data=>{this.schedulesCache.update(cache=>({...cache,[id]:data}));}).catch(()=>{});
    }
  }
  asEmployee(item:TableRow):Employee{return item as Employee;}
  getHorarioSummary(employee:Employee,cache:Record<string,WorkCalendar>):string{
    const cal=cache[employee.id];
    if(!cal?.schedules?.length)return 'Sin turnos';
    const uniqueDays=[...new Set(cal.schedules.map(s=>Number(s.weekday)))].sort((a,b)=>a-b);
    const hasAll=uniqueDays.length===6&&uniqueDays[0]===1&&uniqueDays[5]===6;
    const dayLabels=uniqueDays.map(d=>WEEKDAYS.find(w=>w.value===String(d))?.label.slice(0,3)?? '');
    const dayText=hasAll?'Lun–Sáb':dayLabels.join('–');
    const starts=cal.schedules.map(s=>s.start_time).filter(Boolean);
    const ends=cal.schedules.map(s=>s.end_time).filter(Boolean);
    const start=starts.length?starts.sort()[0]:'';
    const end=ends.length?ends.sort().reverse()[0]:'';
    const timeText=start&&end?` · ${start.replace(/:\d{2}$/,'')} - ${end.replace(/:\d{2}$/,'')}`:'';
    return `${dayText}${timeText}`;
  }
  async ngOnInit():Promise<void>{await Promise.all([this.loadEmployees(),this.loadProfiles()]);}
  ngOnDestroy():void{this.revision++;}
  private async loadProfiles():Promise<void>{
    if(!this.authorization.has('employees.manage')||!this.authorization.has('profiles.read'))return;
    try{
      const profiles=await this.employees.eligibleProfiles();
      this.columns=this.columns.map(c=>c.key==='profile_id'?{...c,options:[{value:'',label:'Selecciona un perfil activo'},...profiles.map(p=>({value:p.id,label:profileLabel(p)}))]}:c);
      this.profilesReady.set(true);
    }catch(error){this.errorMessage.set(workError(error));}
  }
  async loadEmployees(query=this.query):Promise<void>{
    this.query=query;const revision=++this.revision;this.loading.set(true);this.errorMessage.set('');
    try{const result=await this.employees.search(query);if(revision===this.revision){this.tableData.set(result.rows);this.total.set(result.total);}}
    catch(error){if(revision===this.revision)this.errorMessage.set(workError(error));}
    finally{if(revision===this.revision)this.loading.set(false);}
  }
  readonly saveEmployee=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{
    if(!this.authorization.has('employees.manage'))throw new Error('No tienes permiso para administrar empleados.');
    await(mode==='create'?this.employees.create(row):mode==='update'?this.employees.update(row):this.employees.remove(row));
    if(mode==='create'){this.query={...this.query,page:1};if(this.table)this.table.currentPage=1;}
    // Invalidar cualquier resultado laboral anterior tras un cambio de actividad/habilidad.
    await this.loadEmployees();
  };
}
