import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Service, ServiciosService } from '../../shared/services/servicios.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import type { PageQuery } from '../../shared/services/clientes.service';
@Component({selector:'app-servicios',standalone:true,imports:[ComponentCardComponent,PageBreadcrumbComponent,PersonalizedTable],templateUrl:'./servicios.component.html'})
export class ServiciosComponent implements OnInit {
  readonly authorization=inject(AuthorizationService);
  private readonly services=inject(ServiciosService);
  @ViewChild('table') table?:PersonalizedTable;
  readonly tableData=signal<Service[]>([]);readonly total=signal(0);readonly loading=signal(false);readonly errorMessage=signal('');
  private query:PageQuery={search:'',page:1,size:5}; private revision=0;
  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Nombre',
      placeholder: 'Ej. Baño completo',
      helpText: 'Escribe el nombre que verá el cliente.',
    },
    {
      key: 'description', required: false,
      label: 'Descripción',
      placeholder: 'Ej. Baño, secado y cepillado',
      helpText: 'Describe brevemente qué incluye el servicio.',
    },
    {
      key: 'base_price',
      label: 'Precio base (S/)',
      type: 'text',
      placeholder: 'Ej. 75',
      helpText: 'Precio en soles, máximo dos decimales (ej. 12.50). Se permite cero.',
    },
    {
      key: 'base_duration_minutes',
      label: 'Duración (min)',
      type: 'number',
      placeholder: 'Ej. 60',
      helpText: 'Indica la duración aproximada en minutos.',
    },
    {
      key: 'requires_specialist',
      label: 'Especialidad',
      helpText: 'Define quién puede realizar este servicio.',
      options: [
        { label: 'Cualquier empleado', value: 'false' },
        { label: 'Solo el principal', value: 'true' },
      ],
    },
    {
      key: 'active',
      label: 'Estado',
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
    },
    {
      key: 'visible_to_clients',
      label: 'Visible para clientes',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  ];

  async ngOnInit():Promise<void>{await this.loadServices();}
  async loadServices(query=this.query):Promise<void>{
    this.query=query;const revision=++this.revision;this.loading.set(true);this.errorMessage.set('');
    try{const result=await this.services.search(query);if(revision===this.revision){this.tableData.set(result.rows);this.total.set(result.total);}}
    catch(error){if(revision===this.revision)this.errorMessage.set(error instanceof Error?error.message:'No se pudieron cargar los servicios.');}
    finally{if(revision===this.revision)this.loading.set(false);}
  }
  readonly saveService=async(row:TableRow,mode:'create'|'update'|'delete'):Promise<void>=>{
    if(!this.authorization.has('services.manage'))throw new Error('No tienes permiso para administrar servicios.');
    await(mode==='create'?this.services.create(row):mode==='update'?this.services.update(row):this.services.remove(row));
    if(mode==='create'){this.query={...this.query,page:1};if(this.table)this.table.currentPage=1;}
    await this.loadServices();
  };
}
