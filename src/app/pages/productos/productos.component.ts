import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { InventoryService } from '../../shared/services/inventory.service';
import { InventoryBalance, InventoryInput, InventoryMovement, InventoryHistoryQuery, INVENTORY_LABELS } from '../../shared/services/inventory.models';
import { limaDateTime } from '../../shared/services/work-calendar.service';
import { SalesService } from '../../shared/services/sales.service';
import { Product } from '../../shared/services/sale.models';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { decimalLabel } from '../../shared/services/service-pricing.models';
@Component({ standalone:true, selector:'app-productos', imports:[FormsModule,A11yModule,PageBreadcrumbComponent,ComponentCardComponent], templateUrl:'./productos.component.html' })
export class ProductosComponent implements OnDestroy {
 readonly api = inject(SalesService); readonly auth = inject(AuthorizationService);
 readonly error = signal(''); readonly loading = signal(false); readonly busy = signal(false);
 readonly money = decimalLabel;
 readonly field = 'w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white';
 readonly button = 'rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50 dark:border-gray-700';
 search = ''; page = 1; total = 0; private revision = 0;
 ngOnDestroy() { this.revision++; this.historyRevision++; }
 message(e: unknown) { return (e as {message?:string})?.message || 'No se pudo completar la operación.'; }
 rows = signal<Product[]>([]); editing = signal(false);
 id: string | null = null; name = ''; sku = ''; price = ''; active = true;
 ngOnInit() { void this.load(); }
 async load(page = 1) { const rev = ++this.revision; this.page=page; this.loading.set(true); this.error.set('');
 try { const r=await this.api.products(this.search,page); if(rev===this.revision){this.rows.set(r.rows);this.total=r.total;await this.loadStock(rev);} }
 catch(e){if(rev===this.revision)this.error.set(this.message(e));} finally{if(rev===this.revision)this.loading.set(false);} }
 edit(p?:Product){if(this.busy() || !this.auth.has('products.manage'))return; this.id=p?.id??null;this.name=p?.name??'';this.sku=p?.sku??'';this.price=p?.price??'';this.active=p?.active??true;this.editing.set(true);this.error.set('');}
 async save(){if(this.busy() || !this.auth.has('products.manage'))return;
 if(!this.name.trim() || this.name.trim().length>120 || this.sku.length>60 || !/^\d+(\.\d{1,2})?$/.test(this.price)){this.error.set('Revisa nombre, SKU y precio (máximo dos decimales).');return;}
 this.busy.set(true);try{await this.api.saveProduct({id:this.id,name:this.name.trim(),sku:this.sku.trim()||null,price:this.price,active:this.active});this.editing.set(false);await this.load(this.page);}catch(e){this.error.set(this.message(e));}finally{this.busy.set(false);}}
 readonly inventory = inject(InventoryService);
 readonly balances = signal<Record<string, InventoryBalance>>({});
 readonly canAdjust = signal(false);
 readonly stockProduct = signal<Product | null>(null);
 readonly historyRows = signal<InventoryMovement[]>([]);
 readonly historyLoading = signal(false);
 readonly stockError = signal('');
 readonly kinds = Object.entries(INVENTORY_LABELS);
 readonly kindLabels = INVENTORY_LABELS;
 readonly date = limaDateTime;
 kind: InventoryInput['kind'] = 'RECEIPT';
 delta: number | null = null;
 stockReason = '';
 pendingMovement: InventoryInput | null = null;
 historyQuery: InventoryHistoryQuery = {productId:null,kind:'',from:'',until:'',saleId:'',page:1};
 historyTotal = 0;
 private historyRevision = 0;
 private opener: HTMLElement | null = null;
 async loadStock(rev = this.revision): Promise<void> {
   if (!this.auth.has('inventory.read')) { this.balances.set({}); return; }
   const r = await this.inventory.search(this.search, this.page);
   if (rev !== this.revision) return;
   this.balances.set(Object.fromEntries(r.rows.map(b => [b.product_id, b])));
   this.canAdjust.set(r.can_adjust);
 }
 openStock(p: Product): void {
   if (this.busy() || !this.auth.has('inventory.read')) return;
   this.opener = document.activeElement as HTMLElement;
   this.stockProduct.set(p);
   this.kind = this.balances()[p.id]?.version === 1 ? 'INITIAL' : 'RECEIPT';
   this.delta = null; this.stockReason = ''; this.pendingMovement = null; this.stockError.set('');
   this.historyQuery = {productId:p.id,kind:'',from:'',until:'',saleId:'',page:1};
   void this.loadHistory();
 }
 closeStock(): void {
   if (this.busy() || this.pendingMovement) return;
   this.historyRevision++; this.stockProduct.set(null); this.opener?.focus();
 }
 async loadHistory(page = 1): Promise<void> {
   const rev = ++this.historyRevision;
   this.historyQuery.page = page; this.historyLoading.set(true); this.stockError.set('');
   try {
     const r = await this.inventory.history({...this.historyQuery});
     if (rev === this.historyRevision) { this.historyRows.set(r.rows); this.historyTotal = r.total; }
   } catch(e) { if (rev === this.historyRevision) this.stockError.set(this.message(e)); }
   finally { if (rev === this.historyRevision) this.historyLoading.set(false); }
 }
 async refreshStock(): Promise<void> {
   if (this.busy() || this.pendingMovement) return;
   try { await this.loadStock(); this.stockError.set(''); }
   catch(e) { this.stockError.set(this.message(e)); }
 }
 async recordStock(): Promise<void> {
   const p = this.stockProduct();
   if (!p || this.busy()) return;
   if (!this.pendingMovement) {
     const balance = this.balances()[p.id];
     const permitted = this.kind === 'ADJUSTMENT' ? this.canAdjust() : this.auth.has('inventory.receive');
     if (!p.active || !permitted || !balance) return;
     if (this.delta === null || !Number.isInteger(this.delta) || this.delta === 0 || Math.abs(this.delta)>2147483647 ||
       (this.kind !== 'ADJUSTMENT' && this.delta<1) || !this.stockReason.trim() || this.stockReason.trim().length>500) {
       this.stockError.set('Indica unidades enteras y un motivo; solo los ajustes pueden ser negativos.'); return;
     }
     this.pendingMovement = {product_id:p.id,kind:this.kind,delta:this.delta,reason:this.stockReason.trim(),
       expected_version:balance.version,request_id:crypto.randomUUID()};
   }
   this.busy.set(true); this.stockError.set('');
   try {
     await this.inventory.record(this.pendingMovement);
     this.pendingMovement = null; this.delta = null; this.stockReason = '';
     await this.loadStock(); this.kind = 'RECEIPT'; await this.loadHistory();
   } catch(e) {
     const code = (e as {code?:string}).code;
     if (code && /^(22|23|40|42)/.test(code)) this.pendingMovement = null;
     this.stockError.set(this.message(e)+(this.pendingMovement ? ' Reintenta el mismo envío para resolver el resultado.' : ' Recarga el stock antes de continuar.'));
   } finally { this.busy.set(false); }
 }

}
