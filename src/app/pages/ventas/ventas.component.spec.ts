import { TestBed } from '@angular/core/testing';
import { VentasComponent } from './ventas.component';
import { SalesService } from '../../shared/services/sales.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService } from '../../shared/services/clientes.service';
import { Sale } from '../../shared/services/sale.models';

describe('Registro de ventas', () => {
 let component: VentasComponent;
 let api: jasmine.SpyObj<SalesService>;
 const sale = {id:'sale',version:1,status:'DRAFT',appointment_id:'appointment',items:[{kind:'SERVICE'}]} as Sale;
 beforeEach(() => {
  api=jasmine.createSpyObj('SalesService',['search','createDraft','confirm','cancel','get']);
  api.search.and.resolveTo({rows:[],total:0});
  TestBed.configureTestingModule({providers:[{provide:SalesService,useValue:api},{provide:AuthorizationService,useValue:{has:()=>true}},{provide:ClientesService,useValue:{}}]});
  component=TestBed.runInInjectionContext(()=>new VentasComponent());
 });
 it('conserva UUID y contenido después de una respuesta de red ambigua',async()=>{
  component.clientId='client';component.appointmentId='appointment';
  api.createDraft.and.rejectWith(new Error('network'));await component.create();
  const sent=api.createDraft.calls.mostRecent().args[0];
  component.clientId='changed';api.createDraft.and.resolveTo(sale);await component.create();
  expect(api.createDraft.calls.mostRecent().args[0]).toEqual(sent);
  expect(component.pending).toBeNull();
 });
 it('no inicia otro borrador mientras el envío anterior no está resuelto',async()=>{
  component.clientId='client';component.appointmentId='appointment';api.createDraft.and.rejectWith(new Error('network'));
  await component.create();const pending=component.pending;component.start();expect(component.pending).toBe(pending);
 });
 it('no permite confirmar ventas con productos',()=>{
  expect(component.canConfirm({...sale,items:[{kind:'PRODUCT'}] as Sale['items']})).toBeFalse();
  expect(component.canConfirm(sale)).toBeTrue();
 });
 it('bloquea escrituras tras conflicto hasta recargar',async()=>{
  component.selected.set(sale);api.confirm.and.rejectWith({code:'40001',message:'Recarga'});
  await component.action();await component.action();expect(api.confirm).toHaveBeenCalledTimes(1);
  api.get.and.resolveTo({...sale,version:2});await component.reloadDetail();expect(component.conflict).toBeFalse();
 });
 it('rechaza cantidades fraccionarias antes de enviar',async()=>{
  component.clientId='client';component.lines=[{product_id:'product',name:'Producto',quantity:1.5}];await component.create();
  expect(api.createDraft).not.toHaveBeenCalled();
 });
 it('exige motivo para anular',async()=>{
  component.selected.set(sale);await component.action(true);expect(api.cancel).not.toHaveBeenCalled();
 });
});
