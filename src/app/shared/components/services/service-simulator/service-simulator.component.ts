import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Service, ServiciosService } from '../../../services/servicios.service';
import { TarifasService, ServiceQuote, PetSize } from '../../../services/tarifas.service';
import { PetBreedsService } from '../../../services/pet-breeds.service';
import { decimalLabel } from '../../../services/service-pricing.models';
import { CustomSelectComponent, CustomSelectOption } from '../../form/custom-select/custom-select.component';

@Component({
  selector: 'app-service-simulator', standalone: true, imports: [FormsModule, CustomSelectComponent],
  template: `
  <section class="space-y-4 rounded-xl border border-gray-200 bg-white p-5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
    <h2 class="text-lg font-semibold">Comprueba una tarifa</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">Selecciona un servicio y, si los conoces, el tamaño y la raza. El cálculo no incluye transporte ni reserva un horario.</p>
    @if (error()) { <p role="alert" class="text-error-600 dark:text-error-400">{{ error() }}</p> }
    @if (loading()) { <p role="status">Cargando catálogo…</p> }
    <form (ngSubmit)="calculate()" class="space-y-4">
      <label class="block">Servicio
        <app-custom-select [options]="serviceOptions()" [value]="serviceId" (valueChange)="setService($event)" placeholder="Selecciona un servicio" ariaLabel="Seleccionar servicio" className="mt-2 w-full dark:bg-gray-800" />
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label>Tamaño
          <app-custom-select [options]="sizeOptions" [value]="size" (valueChange)="setSize($event)" placeholder="No indicado" ariaLabel="Seleccionar tamaño" className="mt-2 w-full dark:bg-gray-800" />
        </label>
        <label>Raza
          <app-custom-select [options]="breedOptions" [value]="breed" (valueChange)="setBreed($event)" placeholder="No indicado" ariaLabel="Seleccionar raza" className="mt-2 w-full dark:bg-gray-800" />
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
  private readonly petBreeds = inject(PetBreedsService);
  private revision = 0;
  readonly services = signal<Service[]>([]);
  readonly loading = signal(true);
  readonly calculating = signal(false);
  readonly error = signal('');
  readonly quote = signal<ServiceQuote | null>(null);
  serviceId = ''; size: PetSize | '' = ''; breed: string | '' = '';
  readonly sizeOptions: CustomSelectOption[] = [
    { value: '', label: 'No indicado' }, { value: 'TOY', label: 'Miniatura' },
    { value: 'SMALL', label: 'Pequeño' }, { value: 'MEDIUM', label: 'Mediano' },
    { value: 'LARGE', label: 'Grande' }, { value: 'EXTRA_LARGE', label: 'Extra grande' },
  ];
  breedOptions: CustomSelectOption[] = [{ value: '', label: 'No indicado' }];
  readonly serviceOptions = () => [
    { value: '', label: 'Selecciona un servicio' },
    ...this.services().map(service => ({ value: service.id, label: service.name })),
  ];
  readonly label = decimalLabel;
  async ngOnInit(): Promise<void> {
    try {
      const data = await this.catalogue.getAll(true);
      this.services.set(this.publicOnly ? data.filter(s => s.visible_to_clients) : data);
      const breedRows = await this.petBreeds.getAll(true);
      this.breedOptions = [{ value: '', label: 'No indicado' }, ...breedRows.map(b => ({ value: b.id, label: b.name }))];
    }
    catch { this.error.set('No se pudo cargar el catálogo.'); }
    finally { this.loading.set(false); }
  }
  ngOnDestroy(): void { this.revision++; }
  invalidate(): void { this.revision++; this.quote.set(null); this.calculating.set(false); this.error.set(''); }
  setService(value: string | number | null): void { this.serviceId = value?.toString() ?? ''; this.invalidate(); }
  setSize(value: string | number | null): void { this.size = (value?.toString() ?? '') as PetSize | ''; this.invalidate(); }
  setBreed(value: string | number | null): void { this.breed = value?.toString() ?? ''; this.invalidate(); }
  async calculate(): Promise<void> {
    if (!this.serviceId || this.calculating()) return;
    const revision = ++this.revision;
    this.calculating.set(true); this.quote.set(null); this.error.set('');
    try { const result = await this.pricing.quote(this.serviceId, this.size || null, this.breed || null); if (revision === this.revision) this.quote.set(result); }
    catch (error) { if (revision === this.revision) this.error.set(error instanceof Error ? error.message : 'No se pudo calcular: servicio no disponible o sin permiso.'); }
    finally { if (revision === this.revision) this.calculating.set(false); }
  }
  sourceLabel(source: ServiceQuote['source']): string {
    return { SIZE_BREED: 'Tamaño y raza', SIZE: 'Solo tamaño', BREED: 'Solo raza', GENERAL: 'Tarifa general', BASE: 'Valores base del servicio' }[source];
  }
}
