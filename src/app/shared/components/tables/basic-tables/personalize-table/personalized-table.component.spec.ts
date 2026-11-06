import { PersonalizedTable } from './personalized-table.component';
import { TestBed } from '@angular/core/testing';
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
    table.serverTotal=25;table.searchKey='name';table.itemsPerPage=5;const emit=spyOn(table.queryChanged,'emit');table.onSearch("O'Connor");expect(emit).toHaveBeenCalledWith({search:"O'Connor",page:1,size:5});expect(table.currentItems.length).toBe(1);expect(table.totalPages).toBe(5);
  });
});

describe('PersonalizedTable: tarjetas móviles', () => {
  it('muestra el nombre una vez y distingue las etiquetas de los valores', () => {
    const fixture = TestBed.createComponent(PersonalizedTable);
    fixture.componentInstance.allowCreate = false;
    fixture.componentInstance.columns = [
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
      { key: 'base_price', label: 'Precio base (S/)' },
    ];
    fixture.componentInstance.tableData = [{ name: 'Baño canino', description: 'Baño y secado', base_price: 45 }];
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector('article');
    expect(card?.querySelector('h3')?.textContent?.trim()).toBe('Baño canino');
    expect(Array.from(card?.querySelectorAll('dt') ?? []).map(label => label.textContent?.trim()))
      .toEqual(['Descripción', 'Precio base (S/)']);
    expect(Array.from(card?.querySelectorAll('dd') ?? []).map(value => value.textContent?.trim()))
      .toEqual(['Baño y secado', '45']);
  });

  it('usa el nombre del cliente como título aunque el perfil relacionado sea la primera columna', () => {
    const fixture = TestBed.createComponent(PersonalizedTable);
    fixture.componentInstance.allowCreate = false;
    fixture.componentInstance.columns = [
      { key: 'profile_id', label: 'Perfil relacionado', options: [{ value: 'p1', label: 'Cuenta vinculada' }] },
      { key: 'first_name', label: 'Nombre' },
      { key: 'last_name', label: 'Apellido' },
    ];
    fixture.componentInstance.tableData = [{ profile_id: 'p1', first_name: 'Lucía', last_name: 'Herrera' }];
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector('article');
    expect(card?.querySelector('h3')?.textContent?.trim()).toBe('Lucía');
    expect(Array.from(card?.querySelectorAll('dt') ?? []).map(label => label.textContent?.trim()))
      .toEqual(['Perfil relacionado', 'Apellido']);
  });
});

describe('PersonalizedTable: opciones de radio', () => {
  it('muestra los valores iniciales y permite cambiarlos antes de guardar', async () => {
    const fixture = TestBed.createComponent(PersonalizedTable);
    const table = fixture.componentInstance;
    table.columns = [
      { key: 'name', label: 'Nombre' },
      { key: 'allergies', label: 'Alergias', control: 'radio', options: [{ label: 'No', value: 'false' }, { label: 'Sí', value: 'true' }] },
      { key: 'active', label: 'Estado', control: 'radio', options: [{ label: 'Activo', value: 'true' }, { label: 'Inactivo', value: 'false' }] },
    ];
    const save = jasmine.createSpy().and.resolveTo();
    table.saveAction = save;
    table.openCreateForm();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector<HTMLInputElement>('input[name="allergies"][value="false"]')?.checked).toBeTrue();
    expect(root.querySelector<HTMLInputElement>('input[name="active"][value="true"]')?.checked).toBeTrue();
    root.querySelector<HTMLInputElement>('input[name="allergies"][value="true"]')?.click();
    expect(table.formData['allergies']).toBe('true');
    table.formData['name'] = 'Luna';
    await table.saveRow();
    expect(save).toHaveBeenCalledWith(jasmine.objectContaining({ allergies: 'true', active: 'true' }), 'create');
  });

  it('marca el valor booleano existente al editar', () => {
    const fixture = TestBed.createComponent(PersonalizedTable);
    const table = fixture.componentInstance;
    table.columns = [{ key: 'bites', label: 'Muerde', control: 'radio', options: [{ label: 'No', value: 'false' }, { label: 'Sí', value: 'true' }] }];
    const row = { bites: true };
    table.tableData = [row];
    table.openEditForm(row);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[name="bites"][value="true"]')?.checked).toBeTrue();
  });
});

describe('PersonalizedTable: formulario largo', () => {
  it('mantiene las acciones visibles y permite llegar al último campo sin taparlo', () => {
    const fixture = TestBed.createComponent(PersonalizedTable);
    const table = fixture.componentInstance;
    table.columns = Array.from({ length: 24 }, (_, index) => ({ key: `field_${index}`, label: `Campo ${index}` }));
    table.openCreateForm();
    fixture.detectChanges();

    const modal = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('app-modal .modal > .relative');
    expect(modal).not.toBeNull();
    expect(modal?.clientHeight).toBeLessThan(window.innerHeight);
    if (modal) {
      expect(modal.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
      expect(modal.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
      const fields = modal.querySelector<HTMLElement>('form > div:first-of-type');
      const footer = modal.querySelector<HTMLElement>('form > div:last-child');
      const saveButton = modal.querySelector<HTMLButtonElement>('button[type="submit"]');
      const cancelButton = Array.from(modal.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Cancelar');
      expect(fields?.scrollHeight).toBeGreaterThan(fields?.clientHeight ?? 0);
      expect(saveButton?.getBoundingClientRect().bottom).toBeLessThanOrEqual(modal.getBoundingClientRect().bottom);
      expect(cancelButton?.getBoundingClientRect().bottom).toBeLessThanOrEqual(modal.getBoundingClientRect().bottom);
      if (fields) {
        fields.scrollTop = fields.scrollHeight;
        expect(fields.scrollTop).toBeGreaterThan(0);
      }
      const lastField = Array.from(fields?.querySelectorAll<HTMLInputElement>('input') ?? []).at(-1);
      expect(lastField?.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer?.getBoundingClientRect().top ?? 0);
      expect(saveButton?.textContent?.trim()).toBe('Guardar');
      expect(saveButton?.getBoundingClientRect().bottom).toBeLessThanOrEqual(modal.getBoundingClientRect().bottom);
    }
  });
});
