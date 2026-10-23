import { TestBed } from '@angular/core/testing';
import { ProductosComponent } from './productos.component';
import { SalesService } from '../../shared/services/sales.service';
import { InventoryService } from '../../shared/services/inventory.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { Product } from '../../shared/services/sale.models';
import { InventoryBalance, InventoryMovement } from '../../shared/services/inventory.models';

describe('Inventario en productos', () => {
  let component: ProductosComponent;
  let inventory: jasmine.SpyObj<InventoryService>;
  let allowed: Set<string>;
  const p = {id:'product',name:'Champú',active:true} as Product;
  const b = {product_id:p.id,quantity:10,version:2,initial_loaded:true} as InventoryBalance;
  beforeEach(() => {
    allowed = new Set(['inventory.read','inventory.receive']);
    inventory = jasmine.createSpyObj('InventoryService',['search','record','history']);
    inventory.search.and.resolveTo({rows:[b],total:1,can_adjust:false});
    inventory.history.and.resolveTo({rows:[],total:0});
    TestBed.configureTestingModule({providers:[
      {provide:SalesService,useValue:{}},{provide:InventoryService,useValue:inventory},
      {provide:AuthorizationService,useValue:{has:(code:string)=>allowed.has(code)}},
    ]});
    component=TestBed.runInInjectionContext(()=>new ProductosComponent());
    component.balances.set({[p.id]:b});component.stockProduct.set(p);
    component.delta=2;component.stockReason='Reposición';
  });
  it('conserva UUID, versión y payload ante fallo de red ambiguo',async()=>{
    inventory.record.and.rejectWith(new Error('network'));await component.recordStock();
    const first=inventory.record.calls.mostRecent().args[0];
    component.delta=5;inventory.record.and.resolveTo({id:'movement'} as InventoryMovement);
    await component.recordStock();expect(inventory.record.calls.mostRecent().args[0]).toEqual(first);
    expect(component.pendingMovement).toBeNull();
  });
  it('rechaza fracciones y entradas negativas antes de enviar',async()=>{
    component.delta=1.5;await component.recordStock();component.delta=-1;await component.recordStock();
    expect(inventory.record).not.toHaveBeenCalled();
  });
  it('no permite ajuste sin capacidad OWNER verificada',async()=>{
    component.kind='ADJUSTMENT';await component.recordStock();expect(inventory.record).not.toHaveBeenCalled();
  });
  it('permite ajuste negativo con capacidad y conserva motivo',async()=>{
    component.canAdjust.set(true);component.kind='ADJUSTMENT';component.delta=-2;
    inventory.record.and.resolveTo({id:'movement'} as InventoryMovement);
    await component.recordStock();expect(inventory.record.calls.mostRecent().args[0].delta).toBe(-2);
  });
  it('conflicto libera el formulario para recargar, sin reintento automático',async()=>{
    inventory.record.and.rejectWith({code:'40001',message:'Recarga'});await component.recordStock();
    expect(component.pendingMovement).toBeNull();expect(component.stockError()).toContain('Recarga');
    expect(inventory.record).toHaveBeenCalledTimes(1);
  });
  it('ignora una página de historial que llega después de la nueva búsqueda',async()=>{
    let resolve!: (v:{rows:InventoryMovement[];total:number})=>void;
    inventory.history.and.returnValue(new Promise(r=>resolve=r));
    const first=component.loadHistory();inventory.history.and.resolveTo({rows:[],total:0});
    await component.loadHistory();resolve({rows:[{id:'old'} as InventoryMovement],total:1});await first;
    expect(component.historyRows()).toEqual([]);
  });
  it('no registra entradas manuales sobre productos inactivos',async()=>{
    component.stockProduct.set({...p,active:false});await component.recordStock();expect(inventory.record).not.toHaveBeenCalled();
  });
  it('señala el mínimo exacto y respeta umbral desactivado',()=>{
    expect(component.isLow({...p,minimum_stock:10})).toBeTrue();
    expect(component.isLow({...p,minimum_stock:9})).toBeFalse();
    expect(component.isLow({...p,minimum_stock:null})).toBeFalse();
  });
});
