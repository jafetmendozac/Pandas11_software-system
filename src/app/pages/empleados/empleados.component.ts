import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Employee, EmpleadosService } from '../../shared/services/empleados.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { profileLabel } from '../../shared/services/profiles.service';
import { WorkCalendarComponent } from '../../shared/components/employees/work-calendar/work-calendar.component';
import { workError, WorkCalendarService } from '../../shared/services/work-calendar.service';
@Component({selector:'app-empleados',standalone:true,imports:[ComponentCardComponent,PageBreadcrumbComponent,PersonalizedTable,WorkCalendarComponent],templateUrl:'./empleados.component.html'})
export class EmpleadosComponent implements OnInit,OnDestroy {
  readonly authorization=inject(AuthorizationService);
  private readonly employees=inject(EmpleadosService);
  readonly calendar=inject(WorkCalendarService);
  @ViewChild('table') table?:PersonalizedTable;
  readonly tableData=signal<Employee[]>([]); readonly total=signal(0); readonly loading=signal(false); readonly errorMessage=signal('');
  readonly expandedRowId=signal<string|null>(null);
  readonly profilesReady=signal(false);
  private revision=0;
  columns:TableColumn[]=[
    {key:'employee_name',label:'Nombre',editable:false},
    {key:'phone',label:'Teléfono',required:false},
    {key:'skill_level',label:'Habilidad',options:[{value:'ASSISTANT',label:'Asistente: baño'},{value:'ALL_SERVICES',label:'Baño y corte'}]},
    {key:'active',label:'Estado',options:[{value:'true',label:'Activo'},{value:'false',label:'Inactivo'}]},
    {key:'profile_active',label:'Cuenta activa',editable:false},
    {key:'profile_id',label:'Perfil vinculado',formOnly:true,editable:false,options:[{label:'Selecciona un perfil activo',value:''}],helpText:'Se fija al crear. No concede roles ni acceso al panel.'},
  ];
  toggleRow(id:string):void{
    if(this.expandedRowId()===id){this.expandedRowId.set(null);return;}
    this.expandedRowId.set(id);
  }
  asEmployee(item:TableRow):Employee{return item as Employee;}
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
  async loadEmployees():Promise<void>{
    const revision=++this.revision;this.loading.set(true);this.errorMessage.set('');
    try{const rows=await this.employees.getAll();if(revision===this.revision){this.tableData.set(rows);this.total.set(rows.length);}}
    catch(error){if(revision===this.revision)this.errorMessage.set(workError(error));}
    finally{if(revision===this.revision)this.loading.set(false);}
  }
  readonly saveEmployee=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{
    if(!this.authorization.has('employees.manage'))throw new Error('No tienes permiso para administrar empleados.');
    await(mode==='create'?this.employees.create(row):mode==='update'?this.employees.update(row):this.employees.remove(row));
    // Invalidar cualquier resultado laboral anterior tras un cambio de actividad/habilidad.
    await this.loadEmployees();
  };
}
