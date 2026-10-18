import { Component, Input, OnChanges, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonalizedTable, TableColumn, TableRow } from '../../tables/basic-tables/personalize-table/personalized-table.component';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { AuthorizationService } from '../../../services/authorization.service';
import { Employee } from '../../../services/empleados.service';
import { Availability, WorkCalendar, WorkCalendarService, WEEKDAYS, WORK_NOTICE, limaDateTime, workError } from '../../../services/work-calendar.service';
@Component({selector:'app-work-calendar',standalone:true,imports:[FormsModule,PersonalizedTable,ComponentCardComponent],templateUrl:'./work-calendar.component.html'})
export class WorkCalendarComponent implements OnChanges,OnDestroy {
  @Input() employee:Employee|null=null;
  @ViewChild('shiftTable') shiftTable?:PersonalizedTable;
  @ViewChild('businessTable') businessTable?:PersonalizedTable;
  @ViewChild('blockTable') blockTable?:PersonalizedTable;
  readonly authorization=inject(AuthorizationService);
  private readonly calendar=inject(WorkCalendarService);
  readonly data=signal<WorkCalendar>({schedules:[],business:[],blocks:[]});
  readonly loading=signal(false); readonly error=signal(''); readonly calculating=signal(false);
  readonly result=signal<Availability|null>(null); readonly notice=WORK_NOTICE;
  date=''; start=''; end=''; specialist=false;
  private loadRevision=0; private queryRevision=0;
  readonly periodColumns:TableColumn[]=[
    {key:'weekday',label:'Día',options:WEEKDAYS},
    {key:'start_time',label:'Inicio',type:'time'},
    {key:'end_time',label:'Fin',type:'time'},
  ];
  blockColumns:TableColumn[]=[];
  ngOnChanges():void{
    // Una selección explícita invalida formularios de la persona anterior.
    for(const table of [this.shiftTable,this.businessTable,this.blockTable])table?.closeForm();
    this.data.set({schedules:[],business:[],blocks:[]});this.invalidate();
    this.blockColumns=[
      {key:'employee_id',label:'Ámbito',required:false,options:[{value:'',label:'Todo el local'},...(this.employee?[{value:this.employee.id,label:this.employee.employee_name||'Empleado seleccionado'}]:[])]},
      {key:'starts_local',label:'Inicio (Lima)',type:'datetime-local'},
      {key:'ends_local',label:'Fin (Lima)',type:'datetime-local'},
      {key:'reason',label:'Motivo',helpText:'Ej. descanso, ausencia o recojo; bloquea todo el intervalo.'},
    ];
    void this.load();
  }
  ngOnDestroy():void{this.loadRevision++;this.queryRevision++;}
  async load():Promise<void>{
    const revision=++this.loadRevision;this.loading.set(true);this.error.set('');
    try{const data=await this.calendar.load(this.employee?.id??null);if(revision===this.loadRevision)this.data.set(data);}
    catch(error){if(revision===this.loadRevision)this.error.set(workError(error));}
    finally{if(revision===this.loadRevision)this.loading.set(false);}
  }
  invalidate():void{this.queryRevision++;this.result.set(null);this.calculating.set(false);this.error.set('');}
  async calculate():Promise<void>{
    if(!this.employee||this.calculating())return;
    const revision=++this.queryRevision;this.result.set(null);this.error.set('');this.calculating.set(true);
    try{const result=await this.calendar.availability(this.employee.id,this.date,this.start,this.end,this.specialist);if(revision===this.queryRevision)this.result.set(result);}
    catch(error){if(revision===this.queryRevision)this.error.set(workError(error));}
    finally{if(revision===this.queryRevision)this.calculating.set(false);}
  }
  readonly saveShift=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{await this.savePeriod('employee',row,mode);};
  readonly saveBusiness=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{await this.savePeriod('business',row,mode);};
  private async savePeriod(kind:'employee'|'business',row:TableRow,mode:'create'|'update'|'delete'):Promise<void>{
    if(!this.authorization.has('schedules.manage'))throw new Error('No tienes permiso para cambiar horarios.');
    await this.calendar.savePeriod(kind,row,mode,this.employee?.id??null);this.invalidate();await this.load();
  }
  readonly saveBlock=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{
    if(!this.authorization.has('time_blocks.manage'))throw new Error('No tienes permiso para cambiar bloqueos.');
    await this.calendar.saveBlock(row,mode);this.invalidate();await this.load();
  };
  readonly label=limaDateTime;
  reasonLabel(reason:string):string{
    return ({INACTIVE_EMPLOYEE:'Empleado inactivo',INACTIVE_PROFILE:'Perfil vinculado inactivo',SKILL_REQUIRED:'El servicio requiere habilidad de corte',CLOSED:'Local cerrado ese día',NO_SHIFT:'No tiene turno ese día',OUTSIDE_WORKING_HOURS:'El intervalo no está cubierto por el turno y horario del local',BLOCKED:'Hay un bloqueo en el intervalo',CLOSED_AT_START:'El local está cerrado a la hora de inicio',LATE_START:'El último inicio de servicio es a las 17:00'} as Record<string,string>)[reason]??reason;
  }
}
