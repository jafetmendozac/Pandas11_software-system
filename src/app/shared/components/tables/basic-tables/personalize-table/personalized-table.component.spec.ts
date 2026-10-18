import { PersonalizedTable } from './personalized-table.component';
describe('PersonalizedTable: persistencia confirmada',()=>{
  let table:PersonalizedTable;
  beforeEach(()=>{table=new PersonalizedTable();table.columns=[{key:'name',label:'Nombre'}];table.tableData=[{id:'1',name:'Antes'}];});
  it('conserva formulario y datos si el servidor rechaza',async()=>{
    table.saveAction=async()=>{throw new Error('Sin permiso');};table.openEditForm(table.tableData[0]);table.formData['name']='Después';
    await table.saveRow();expect(table.isFormOpen).toBeTrue();expect(table.tableData[0]['name']).toBe('Antes');expect(table.formData['name']).toBe('Después');expect(table.formError).toBe('Sin permiso');
  });
  it('no modifica filas ni cierra hasta confirmar',async()=>{
    let resolve!:()=>void;table.saveAction=()=>new Promise<void>(r=>resolve=r);table.openCreateForm();table.formData['name']='Nueva';
    const pending=table.saveRow();expect(table.pending).toBeTrue();expect(table.tableData.length).toBe(1);expect(table.isFormOpen).toBeTrue();
    resolve();await pending;expect(table.isFormOpen).toBeFalse();expect(table.pending).toBeFalse();
  });
  it('valida selectores requeridos antes de guardar',async()=>{
    table.columns=[{key:'client',label:'Cliente',options:[{label:'Selecciona',value:''}]}];const save=jasmine.createSpy().and.resolveTo();table.saveAction=save;table.openCreateForm();await table.saveRow();expect(save).not.toHaveBeenCalled();expect(table.formError).toContain('Cliente');
  });
  it('mantiene el contrato de eventos de tablas antiguas',async()=>{
    const emit=spyOn(table.rowCreated,'emit');table.openCreateForm();table.formData['name']='Nueva';await table.saveRow();expect(emit).toHaveBeenCalled();expect(table.isFormOpen).toBeFalse();
  });
  it('emite página y búsqueda al servidor sin filtrar solo filas locales',()=>{
    table.serverTotal=25;table.searchKey='name';const emit=spyOn(table.queryChanged,'emit');table.onSearch("O'Connor");expect(emit).toHaveBeenCalledWith({search:"O'Connor",page:1,size:5});expect(table.currentItems.length).toBe(1);expect(table.totalPages).toBe(5);
  });
});
