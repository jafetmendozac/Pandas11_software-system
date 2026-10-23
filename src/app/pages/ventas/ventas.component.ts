import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { InventoryDisposition } from '../../shared/services/inventory.models';
import { SalesService } from '../../shared/services/sales.service';
import { Product, Sale, SaleDraftInput } from '../../shared/services/sale.models';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService, Client } from '../../shared/services/clientes.service';
import { Appointment } from '../../shared/services/appointment.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { decimalLabel } from '../../shared/services/service-pricing.models';
import { CommercialService } from '../../shared/services/commercial.service';
import { SalePayment, SalePaymentSummary } from '../../shared/services/commercial.models';
import { PaymentMethod } from '../../shared/services/payment.models';
@Component({standalone:true,selector:'app-ventas',imports:[FormsModule,RouterLink,A11yModule,PageBreadcrumbComponent,ComponentCardComponent],templateUrl:'./ventas.component.html'})
export class VentasComponent implements OnDestroy {
 readonly api = inject(SalesService); readonly auth = inject(AuthorizationService);
 readonly commercial = inject(CommercialService);
 readonly error = signal(''); readonly loading = signal(false); readonly busy = signal(false);
 readonly money = decimalLabel;
 readonly field = 'w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
 readonly button = 'rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50 dark:border-gray-700';
 search = ''; page = 1; total = 0; private revision = 0;
 ngOnDestroy() { this.revision++; this.optionRevision++; }
 message(e: unknown) { return (e as {message?:string})?.message || 'No se pudo completar la operación.'; }
 readonly clientsApi=inject(ClientesService);
 rows=signal<Sale[]>([]); selected=signal<Sale|null>(null); creating=signal(false);
 clients=signal<Client[]>([]); appointments=signal<Appointment[]>([]); products=signal<Product[]>([]);
 optionSearch=''; optionPage=1; optionTotal=0; optionKind: 'clients'|'appointments'|'products'='clients'; private optionRevision=0;
 clientId=''; clientName=''; appointmentId=''; lines:{product_id:string;quantity:number;name:string}[]=[];
 disposition: InventoryDisposition | '' = '';
 reason=''; pending:SaleDraftInput|null=null; conflict=false;
 readonly paymentSummary=signal<SalePaymentSummary|null>(null);
 readonly paymentRows=signal<SalePayment[]>([]);
 paymentPage=1; paymentTotal=0;
 paymentAmount=''; paymentMethod:PaymentMethod='CASH'; operationCode=''; externalRef=''; rejectionReason='';
 pendingPayment:{sale_id:string;amount:string;method:PaymentMethod;operation_code:string|null;external_ref:string|null;request_id:string}|null=null;
 private opener:HTMLElement|null=null;
 constructor(){void this.load();}
 async load(page=1){const rev=++this.revision;this.page=page;this.loading.set(true);this.error.set('');try{const r=await this.api.search(this.search,page);if(rev===this.revision){this.rows.set(r.rows);this.total=r.total;}}catch(e){if(rev===this.revision)this.error.set(this.message(e));}finally{if(rev===this.revision)this.loading.set(false);}}
 async detail(s:Sale){if(this.busy())return;this.opener=document.activeElement as HTMLElement;this.busy.set(true);this.error.set('');try{this.selected.set(await this.api.get(s.id));this.reason='';this.disposition='';this.conflict=false;await this.loadPayments(s.id);}catch(e){this.error.set(this.message(e));}finally{this.busy.set(false);}}
 async loadPayments(id:string,page=1){if(!this.auth.has('sale_payments.read'))return;const [summary,list]=await Promise.all([this.commercial.saleSummary(id),this.commercial.salePayments(id,page)]);this.paymentSummary.set(summary);this.paymentRows.set(list.rows);this.paymentPage=page;this.paymentTotal=list.total;}
 async registerPayment(){const s=this.selected();if(!s||this.busy()||!this.auth.has('sale_payments.create'))return;
   if(!this.pendingPayment){if(!/^\d+(\.\d{1,2})?$/.test(this.paymentAmount)||Number(this.paymentAmount)<=0||this.operationCode.length>120||this.externalRef.length>120){this.error.set('Importe positivo con máximo dos decimales; referencias de hasta 120 caracteres.');return;}
   this.pendingPayment={sale_id:s.id,amount:this.paymentAmount,method:this.paymentMethod,operation_code:this.operationCode.trim()||null,external_ref:this.externalRef.trim()||null,request_id:crypto.randomUUID()};}
   this.busy.set(true);this.error.set('');try{await this.commercial.registerSalePayment(this.pendingPayment);this.pendingPayment=null;this.paymentAmount='';this.operationCode='';this.externalRef='';await this.loadPayments(s.id);}
   catch(e){const code=(e as {code?:string}).code;if(code&&/^(22|23|40|42)/.test(code))this.pendingPayment=null;this.error.set(this.message(e));}finally{this.busy.set(false);}}
 async decidePayment(p:SalePayment,verify:boolean){const s=this.selected();if(!s||this.busy()||!this.auth.has('sale_payments.verify'))return;
   if(!verify&&!this.rejectionReason.trim()){this.error.set('Escribe el motivo del rechazo.');return;}
   this.busy.set(true);this.error.set('');try{if(verify)await this.commercial.verifySalePayment(p);else await this.commercial.rejectSalePayment(p,this.rejectionReason.trim());this.rejectionReason='';await this.loadPayments(s.id);this.selected.set(await this.api.get(s.id));}
   catch(e){this.error.set(this.message(e));}finally{this.busy.set(false);}}
 close(){if(this.busy())return;this.selected.set(null);this.paymentSummary.set(null);this.paymentRows.set([]);this.pendingPayment=null;this.opener?.focus();}
 start(){if(this.busy()||this.pending||!this.auth.has('sales.manage'))return;this.pending=null;this.clientId='';this.clientName='';this.appointmentId='';this.lines=[];this.creating.set(true);void this.options('clients');}
 async options(kind=this.optionKind,page=1){const rev=++this.optionRevision;this.optionKind=kind;this.optionPage=page;this.error.set('');this.clients.set([]);this.appointments.set([]);this.products.set([]);
 try{if(kind==='clients'){const r=await this.clientsApi.search({search:this.optionSearch,page,size:10});if(rev===this.optionRevision){this.clients.set(r.rows);this.optionTotal=r.total;}}
 else if(kind==='appointments'){const r=await this.api.appointments(this.optionSearch,page);if(rev===this.optionRevision){this.appointments.set(r.rows.filter(a=>a.client_id===this.clientId&&a.source==='INTERNAL'));this.optionTotal=r.total;}}
 else{const r=await this.api.products(this.optionSearch,page,10,true);if(rev===this.optionRevision){this.products.set(r.rows);this.optionTotal=r.total;}}}catch(e){if(rev===this.optionRevision)this.error.set(this.message(e));}}
 chooseClient(c:Client){this.clientId=c.id;this.clientName=c.first_name+' '+(c.last_name||'');this.appointmentId='';}
 add(p:Product){if(!this.lines.some(l=>l.product_id===p.id))this.lines.push({product_id:p.id,quantity:1,name:p.name});}
 async create(){if(this.busy()||!this.auth.has('sales.manage'))return;
 if(!this.pending){if(!this.clientId||(!this.appointmentId&&!this.lines.length)||this.lines.some(l=>!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>1000000)){this.error.set('Selecciona cliente y servicios o productos con cantidades enteras positivas.');return;}
 this.pending={request_id:crypto.randomUUID(),client_id:this.clientId,appointment_id:this.appointmentId||null,products:this.lines.map(({product_id,quantity})=>({product_id,quantity}))};}
 this.busy.set(true);this.error.set('');try{this.selected.set(await this.api.createDraft(this.pending));this.creating.set(false);this.pending=null;await this.load();}catch(e){const code=(e as {code?:string}).code; if(code && /^(22|23|42)/.test(code)) this.pending=null; this.error.set(this.message(e)+(this.pending?' Reintenta el mismo envío para comprobar si se guardó.':''));}finally{this.busy.set(false);}}
 hasProducts(s: Sale) { return s.items.some(i => i.kind === 'PRODUCT'); }
 needsDisposition(s: Sale) { return s.status === 'CONFIRMED' && this.hasProducts(s); }
 canCancel(s: Sale) {
   const paid = s.confirmed_appointment_payments && !/^0(?:\.0+)?$/.test(s.confirmed_appointment_payments);
   return (!this.needsDisposition(s) && !paid) || s.can_cancel_products;
 }
 canConfirm(s:Sale){return s.status==='DRAFT' && s.items.length>0;}
 async action(cancel=false){const s=this.selected();if(!s||this.busy()||this.conflict||!this.auth.has('sales.manage'))return;
 if(cancel && this.needsDisposition(s) && !this.disposition){this.error.set('Selecciona si la mercadería vuelve al inventario.');return;}
 if(cancel&&!this.reason.trim()){this.error.set('Escribe el motivo de anulación.');return;}
 this.busy.set(true);this.error.set('');try{this.selected.set(await(cancel?this.api.cancel(s,this.reason.trim(),this.needsDisposition(s) ? this.disposition as InventoryDisposition : null):this.api.confirm(s)));await this.load(this.page);}catch(e){this.conflict=(e as {code?:string}).code==='40001';this.error.set(this.message(e));}finally{this.busy.set(false);}}
 async reloadDetail(){const s=this.selected();if(s)await this.detail(s);}
 label(s:Sale){return {DRAFT:'Borrador',CONFIRMED:'Confirmada',CANCELLED:'Anulada'}[s.status];}
}
