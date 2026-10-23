import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Service, ServiciosService } from '../../../services/servicios.service';
import { TarifasService, ServiceQuote, PetSize, PetCoatType } from '../../../services/tarifas.service';
import { decimalLabel } from '../../../services/service-pricing.models';

@Component({
  selector: 'app-service-simulator', standalone: true, imports: [FormsModule],
  template: `
  <section class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
    <h2 class="text-lg font-semibold">Comprueba una tarifa</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">Selecciona un servicio y, si los conoces, el tamaño y el pelaje. El cálculo no incluye transporte ni reserva un horario.</p>
    @if (error()) { <p role="alert" class="text-error-600 dark:text-error-400">{{ error() }}</p> }
    @if (loading()) { <p role="status">Cargando catálogo…</p> }
    <form (ngSubmit)="calculate()" class="space-y-4">
      <label class="block">Servicio
        <select name="service" [(ngModel)]="serviceId" (ngModelChange)="invalidate()" class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800">
          <option value="">Selecciona un servicio</option>
          @for (service of services(); track service.id) { <option [value]="service.id">{{ service.name }}</option> }
        </select>
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label>Tamaño
          <select name="size" [(ngModel)]="size" (ngModelChange)="invalidate()" class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800">
            <option value="">No indicado</option><option value="TOY">Miniatura</option><option value="SMALL">Pequeño</option><option value="MEDIUM">Mediano</option><option value="LARGE">Grande</option><option value="EXTRA_LARGE">Extra grande</option>
          </select>
        </label>
        <label>Pelaje
          <select name="coat" [(ngModel)]="coat" (ngModelChange)="invalidate()" class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800">
            <option value="">No indicado</option><option value="SHORT">Corto</option><option value="MEDIUM">Medio</option><option value="LONG">Largo</option><option value="WIRE">Cerda</option><option value="CURLY">Rizado</option><option value="HAIRLESS">Sin pelo</option>
          </select>
        </label>
      </div>
      <button type="submit" [disabled]="!serviceId || calculating() || loading()" class="rounded-lg bg-brand-500 px-5 py-3 text-white disabled:opacity-50">{{ calculating() ? 'Calculando…' : 'Calcular' }}</button>
    </form>
    @if (quote(); as result) {
      <div role="status" aria-live="polite" class="rounded-lg bg-brand-50 p-4 dark:bg-brand-500/10">
        <p class="text-sm font-medium">Precio y tiempo calculados</p>
        <p class="mt-1 text-lg font-semibold">S/ {{ label(result.price) }} · {{ result.duration_minutes }} minutos</p>
        <p class="mt-1 text-sm">Se aplicó: {{ sourceLabel(result.source) }}</p>
      </div>
    }
  </section>`,
})
export class ServiceSimulatorComponent implements OnInit, OnDestroy {
  @Input() publicOnly = false;
  private readonly catalogue = inject(ServiciosService);
  private readonly pricing = inject(TarifasService);
  private revision = 0;
  readonly services = signal<Service[]>([]);
  readonly loading = signal(true);
  readonly calculating = signal(false);
  readonly error = signal('');
  readonly quote = signal<ServiceQuote | null>(null);
  serviceId = ''; size: PetSize | '' = ''; coat: PetCoatType | '' = '';
  readonly label = decimalLabel;
  async ngOnInit(): Promise<void> {
    try { const data = await this.catalogue.getAll(true); this.services.set(this.publicOnly ? data.filter(s => s.visible_to_clients) : data); }
    catch { this.error.set('No se pudo cargar el catálogo.'); }
    finally { this.loading.set(false); }
  }
  ngOnDestroy(): void { this.revision++; }
  invalidate(): void { this.revision++; this.quote.set(null); this.calculating.set(false); this.error.set(''); }
  async calculate(): Promise<void> {
    if (!this.serviceId || this.calculating()) return;
    const revision = ++this.revision;
    this.calculating.set(true); this.quote.set(null); this.error.set('');
    try { const result = await this.pricing.quote(this.serviceId, this.size || null, this.coat || null); if (revision === this.revision) this.quote.set(result); }
    catch (error) { if (revision === this.revision) this.error.set(error instanceof Error ? error.message : 'No se pudo calcular: servicio no disponible o sin permiso.'); }
    finally { if (revision === this.revision) this.calculating.set(false); }
  }
  sourceLabel(source: ServiceQuote['source']): string {
    return { SIZE_COAT: 'Tamaño y pelaje', SIZE: 'Solo tamaño', COAT: 'Solo pelaje', GENERAL: 'Tarifa general', BASE: 'Valores base del servicio' }[source];
  }
}
