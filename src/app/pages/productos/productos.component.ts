import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { SalesService } from '../../shared/services/sales.service';
import { Product, Sale, SaleDraftInput } from '../../shared/services/sale.models';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService, Client } from '../../shared/services/clientes.service';
import { Appointment } from '../../shared/services/appointment.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { decimalLabel } from '../../shared/services/service-pricing.models';
@Component({ standalone:true, selector:'app-productos', imports:[FormsModule,PageBreadcrumbComponent,ComponentCardComponent], templateUrl:'./productos.component.html' })
export class ProductosComponent implements OnDestroy {
 readonly api = inject(SalesService); readonly auth = inject(AuthorizationService);
 readonly error = signal(''); readonly loading = signal(false); readonly busy = signal(false);
 readonly money = decimalLabel;
 readonly field = 'w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
 readonly button = 'rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50 dark:border-gray-700';
 search = ''; page = 1; total = 0; private revision = 0;
 ngOnDestroy() { this.revision++; }
 message(e: unknown) { return (e as {message?:string})?.message || 'No se pudo completar la operación.'; }
 rows = signal<Product[]>([]); editing = signal(false);
 id: string | null = null; name = ''; sku = ''; price = ''; active = true;
 constructor() { void this.load(); }
 async load(page = 1) { const rev = ++this.revision; this.page=page; this.loading.set(true); this.error.set('');
 try { const r=await this.api.products(this.search,page); if(rev===this.revision){this.rows.set(r.rows);this.total=r.total;} }
 catch(e){if(rev===this.revision)this.error.set(this.message(e));} finally{if(rev===this.revision)this.loading.set(false);} }
 edit(p?:Product){if(this.busy() || !this.auth.has('products.manage'))return; this.id=p?.id??null;this.name=p?.name??'';this.sku=p?.sku??'';this.price=p?.price??'';this.active=p?.active??true;this.editing.set(true);this.error.set('');}
 async save(){if(this.busy() || !this.auth.has('products.manage'))return;
 if(!this.name.trim() || this.name.trim().length>120 || this.sku.length>60 || !/^\d+(\.\d{1,2})?$/.test(this.price)){this.error.set('Revisa nombre, SKU y precio (máximo dos decimales).');return;}
 this.busy.set(true);try{await this.api.saveProduct({id:this.id,name:this.name.trim(),sku:this.sku.trim()||null,price:this.price,active:this.active});this.editing.set(false);await this.load(this.page);}catch(e){this.error.set(this.message(e));}finally{this.busy.set(false);}}
}
