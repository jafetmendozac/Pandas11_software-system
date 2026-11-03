import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommercialService } from '../../shared/services/commercial.service';
import { CashMovement, CashMovementInput, CashSession } from '../../shared/services/commercial.models';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { decimalLabel } from '../../shared/services/service-pricing.models';
import { limaDateTime } from '../../shared/services/work-calendar.service';
import { PAYMENT_METHODS } from '../../shared/services/payment.models';

@Component({ standalone:true, selector:'app-caja', imports:[FormsModule,PageBreadcrumbComponent,ComponentCardComponent], templateUrl:'./caja.component.html' })
export class CajaComponent {
  readonly api=inject(CommercialService); readonly auth=inject(AuthorizationService);
  readonly money=decimalLabel; readonly date=limaDateTime;
  readonly paymentMethods=PAYMENT_METHODS;
  readonly field='w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
  readonly button='rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50 dark:border-gray-700';
  readonly session=signal<CashSession|null>(null); readonly rows=signal<CashMovement[]>([]);
  readonly sessions=signal<CashSession[]>([]); readonly hasOpen=signal(false);
  readonly error=signal(''); readonly busy=signal(false);
  page=1; total=0; sessionPage=1; sessionTotal=0; opening='0'; counted=''; amount=''; reason=''; source:'MANUAL_IN'|'MANUAL_OUT'='MANUAL_IN';
  pendingOpen:string|null=null; pendingMove:CashMovementInput|null=null;
  constructor(){void this.load();}
  message(e:unknown){return (e as {message?:string})?.message||'No se pudo completar la operación.';}
  validMoney(value:string,positive=false){return /^\d+(\.\d{1,2})?$/.test(value)&&Number.isFinite(Number(value))&&(!positive||Number(value)>0);}
  async load(id:string|null=null){this.error.set('');try{const latest=await this.api.cashOverview();this.hasOpen.set(latest?.status==='OPEN');const s=id?await this.api.cashOverview(id):latest;this.session.set(s);this.page=1;await this.movements();await this.loadSessions(this.sessionPage);}catch(e){this.error.set(this.message(e));}}
  async loadSessions(page=1){try{const r=await this.api.cashSessions(page);this.sessions.set(r.rows);this.sessionPage=page;this.sessionTotal=r.total;}catch(e){this.error.set(this.message(e));}}
  async movements(page=1){const s=this.session();if(!s){this.rows.set([]);this.total=0;return;}this.page=page;
    try{const r=await this.api.cashMovements(s.id,page);this.rows.set(r.rows);this.total=r.total;}catch(e){this.error.set(this.message(e));}}
  async open(){if(this.busy()||!this.auth.has('cash.open'))return;if(!this.validMoney(this.opening)){this.error.set('Indica un fondo inicial válido en PEN.');return;}
    this.pendingOpen ??= crypto.randomUUID();this.busy.set(true);this.error.set('');try{await this.api.openCash(this.opening,this.pendingOpen);this.pendingOpen=null;await this.load();}
    catch(e){if((e as {code?:string}).code?.match(/^(22|23|40|42)/))this.pendingOpen=null;this.error.set(this.message(e));}finally{this.busy.set(false);}}
  async record(){const s=this.session();if(!s||this.busy()||!this.auth.has('cash.move'))return;
    if(!this.validMoney(this.amount,true)||!this.reason.trim()||this.reason.trim().length>500){this.error.set('Indica importe positivo y motivo (máximo 500 caracteres).');return;}
    this.pendingMove ??={session_id:s.id,source:this.source,amount:this.amount,reason:this.reason.trim(),request_id:crypto.randomUUID()};
    this.busy.set(true);this.error.set('');try{await this.api.recordCash(this.pendingMove);this.pendingMove=null;this.amount='';this.reason='';await this.load(s.id);}
    catch(e){if((e as {code?:string}).code?.match(/^(22|23|40|42)/))this.pendingMove=null;this.error.set(this.message(e));}finally{this.busy.set(false);}}
  async close(){const s=this.session();if(!s||this.busy()||!this.auth.has('cash.close'))return;
    if(!this.validMoney(this.counted)){this.error.set('Indica el efectivo contado en PEN.');return;}
    this.busy.set(true);this.error.set('');try{this.session.set(await this.api.closeCash(s,this.counted));this.hasOpen.set(false);await this.movements();await this.loadSessions(this.sessionPage);}
    catch(e){this.error.set(this.message(e));}finally{this.busy.set(false);}}
  label(source:CashMovement['source']){return {APPOINTMENT_PAYMENT:'Cobro de cita',SALE_PAYMENT:'Cobro de productos',MANUAL_IN:'Ingreso manual',MANUAL_OUT:'Retiro manual'}[source];}
}
