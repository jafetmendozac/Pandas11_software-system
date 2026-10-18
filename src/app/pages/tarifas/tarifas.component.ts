import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { ServiciosService } from '../../shared/services/servicios.service';
import { ServicePrice, TarifasService } from '../../shared/services/tarifas.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ServiceSimulatorComponent } from '../../shared/components/services/service-simulator/service-simulator.component';
import type { PageQuery } from '../../shared/services/clientes.service';
@Component({selector:'app-tarifas',standalone:true,imports:[ComponentCardComponent,PageBreadcrumbComponent,PersonalizedTable,ServiceSimulatorComponent],templateUrl:'./tarifas.component.html'})
export class TarifasComponent implements OnInit {
  readonly authorization=inject(AuthorizationService);
  private readonly prices=inject(TarifasService);private readonly services=inject(ServiciosService);
  @ViewChild('table') table?:PersonalizedTable;
  readonly tableData=signal<ServicePrice[]>([]);readonly total=signal(0);readonly loading=signal(false);readonly errorMessage=signal('');
  private query:PageQuery={search:'',page:1,size:5};private revision=0;
  columns: TableColumn[] = [
    {
      key: 'service_id',
      label: 'Servicio',
      helpText: 'Selecciona el servicio al que aplica esta tarifa.',
      options: [],
    },
    {
      key: 'pet_size', required: false,
      label: 'Tamaño',
      helpText: 'Define el tamaño de la mascota.',
      options: [
        { label: 'Todos los tamaños', value: '' },
        { label: 'Miniatura', value: 'TOY' },
        { label: 'Pequeño', value: 'SMALL' },
        { label: 'Mediano', value: 'MEDIUM' },
        { label: 'Grande', value: 'LARGE' },
        { label: 'Extra grande', value: 'EXTRA_LARGE' },
      ],
    },
    {
      key: 'pet_coat_type', required: false,
      label: 'Tipo de pelo',
      helpText: 'Define el tipo de pelaje de la mascota.',
      options: [
        { label: 'Todos los pelajes', value: '' },
        { label: 'Corto', value: 'SHORT' },
        { label: 'Medio', value: 'MEDIUM' },
        { label: 'Largo', value: 'LONG' },
        { label: 'Cerda', value: 'WIRE' },
        { label: 'Rizado', value: 'CURLY' },
        { label: 'Sin pelo', value: 'HAIRLESS' },
      ],
    },
    {
      key: 'price',
      label: 'Precio (S/)',
      type: 'text',
      placeholder: 'Ej. 75',
      helpText: 'Máximo dos decimales, por ejemplo 12.50. Cero es válido.',
    },
    {
      key: 'duration_minutes',
      label: 'Duración (min)',
      type: 'number',
      placeholder: 'Ej. 60',
      helpText: 'Indica la duración aproximada en minutos.',
    },
  ];

  async ngOnInit():Promise<void>{
    if(this.authorization.has('service_prices.manage')){
      try{const services=await this.services.getAll();this.columns=this.columns.map(c=>c.key==='service_id'?{...c,options:[{label:'Selecciona un servicio',value:''},...services.map(s=>({label:s.name+(s.active?'':' (inactivo)'),value:s.id}))]}:c);}
      catch{this.errorMessage.set('No se pudieron cargar los servicios seleccionables.');}
    }
    await this.loadTarifas();
  }
  async loadTarifas(query=this.query):Promise<void>{
    this.query=query;const revision=++this.revision;this.loading.set(true);this.errorMessage.set('');
    try{const result=await this.prices.search(query);if(revision===this.revision){this.tableData.set(result.rows);this.total.set(result.total);}}
    catch(error){if(revision===this.revision)this.errorMessage.set(error instanceof Error?error.message:'No se pudieron cargar las tarifas.');}
    finally{if(revision===this.revision)this.loading.set(false);}
  }
  readonly savePrice=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{
    if(!this.authorization.has('service_prices.manage'))throw new Error('No tienes permiso para administrar tarifas.');
    await(mode==='create'?this.prices.create(row):mode==='update'?this.prices.update(row):this.prices.remove(row));
    if(mode!=='update'){this.query={...this.query,page:1};if(this.table)this.table.currentPage=1;}
    await this.loadTarifas();
  };
}
