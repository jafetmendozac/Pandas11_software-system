import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TableRow } from '../components/tables/basic-tables/personalize-table/personalized-table.component';
import { PageQuery, PageResult } from './clientes.service';
import { Profile } from './profiles.service';

export type SkillLevel = 'ALL_SERVICES' | 'ASSISTANT';
export interface Employee extends TableRow {
  id: string;
  profile_id: string;
  employee_name: string;
  profile_active: boolean;
  phone: string | null;
  skill_level: SkillLevel;
  active: boolean;
  created_at: string;
  updated_at: string;
}
@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  constructor(private readonly supabase: SupabaseService) {}
  async search(query: PageQuery): Promise<PageResult<Employee>> {
    const {data,error} = await this.supabase.client.rpc('search_employees', {p_search:query.search,p_page:query.page,p_size:query.size});
    if (error) throw error;
    return data as PageResult<Employee>;
  }
  async getAll(): Promise<Employee[]> {
    const rows: Employee[]=[];
    for(let page=1;;page++) {
      const result=await this.search({search:'',page,size:100}); rows.push(...result.rows);
      if(rows.length>=result.total || !result.rows.length) return rows;
    }
  }
  // Solo para quien administra empleados y puede consultar perfiles. STAFF nunca ejecuta esta consulta.
  async eligibleProfiles(): Promise<Profile[]> {
    const rows: Profile[]=[];
    for(let offset=0;;offset+=100) {
      const {data,error}=await this.supabase.client.from('profiles').select('id,first_name,last_name,active')
        .eq('active',true).order('id').range(offset,offset+99);
      if(error) throw error;
      rows.push(...data as Profile[]); if(data.length<100) return rows;
    }
  }
  async create(row: TableRow): Promise<void> { await this.save(row); }
  async update(row: TableRow): Promise<void> { await this.save(row,String(row['id'])); }
  async remove(row: TableRow): Promise<void> { await this.save({active:false},String(row['id'])); }
  private async save(row: TableRow,id?:string): Promise<void> {
    const {data,error}=await this.supabase.client.rpc('save_employee',{p_input:row,...(id?{p_id:id}:{})});
    if(error) throw new Error(error.message);
    if(!data) throw new Error('No se guardó el empleado.');
  }
}
