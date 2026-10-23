import { TestBed } from '@angular/core/testing';
import { VentasComponent } from './ventas.component';
import { SalesService } from '../../shared/services/sales.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService } from '../../shared/services/clientes.service';
import { Sale } from '../../shared/services/sale.models';
import { CommercialService } from '../../shared/services/commercial.service';

describe('Registro de ventas', () => {
 let component: VentasComponent;
 let api: jasmine.SpyObj<SalesService>;
 let commercial: jasmine.SpyObj<CommercialService>;
 const sale = {id:'sale',version:1,status:'DRAFT',appointment_id:'appointment',items:[{kind:'SERVICE'}]} as Sale;
 beforeEach(() => {
  api=jasmine.createSpyObj('SalesService',['search','createDraft','confirm','cancel','get']);
  api.search.and.resolveTo({rows:[],total:0});
  commercial=jasmine.createSpyObj('CommercialService',['saleSummary','salePayments','registerSalePayment','verifySalePayment','rejectSalePayment']);
  commercial.saleSummary.and.resolveTo({sale_id:'sale',status:'DRAFT',sale_total:'0',service_total:'0',product_total:'0',product_paid:'0',product_pending:'0',product_outstanding:'0',appointment_paid:'0'});
  commercial.salePayments.and.resolveTo({rows:[],total:0});
  TestBed.configureTestingModule({providers:[{provide:SalesService,useValue:api},{provide:CommercialService,useValue:commercial},{provide:AuthorizationService,useValue:{has:()=>true}},{provide:ClientesService,useValue:{}}]});
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
 it('permite solicitar confirmación de productos y deja la validación de stock al servidor',()=>{
  expect(component.canConfirm({...sale,items:[{kind:'PRODUCT'}] as Sale['items']})).toBeTrue();
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
 it('exige disposición explícita al anular productos confirmados',async()=>{
  const confirmed={...sale,status:'CONFIRMED',items:[{kind:'PRODUCT'}],can_cancel_products:true} as Sale;
  component.selected.set(confirmed);component.reason='Devolución';
  await component.action(true);expect(api.cancel).not.toHaveBeenCalled();
  component.disposition='RESTOCK';api.cancel.and.resolveTo({...confirmed,status:'CANCELLED'});
  await component.action(true);expect(api.cancel).toHaveBeenCalledWith(confirmed,'Devolución','RESTOCK');
 });
 it('ADMIN no ve anulación de productos confirmados aunque no tengan pagos',()=>{
  expect(component.canCancel({...sale,status:'CONFIRMED',items:[{kind:'PRODUCT'}],can_cancel_products:false} as Sale)).toBeFalse();
 });
 it('reintenta cobro de productos con el mismo UUID ante red ambigua',async()=>{
  component.selected.set({...sale,status:'CONFIRMED',items:[{kind:'PRODUCT'}]} as Sale);
  component.paymentAmount='4.25';commercial.registerSalePayment.and.rejectWith(new Error('network'));
  await component.registerPayment();const first=commercial.registerSalePayment.calls.mostRecent().args[0];
  component.paymentAmount='9.99';commercial.registerSalePayment.and.resolveTo({id:'payment'} as never);
  await component.registerPayment();expect(commercial.registerSalePayment.calls.mostRecent().args[0]).toEqual(first);
  expect(component.pendingPayment).toBeNull();
 });

});
