import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthorizationService } from '../../../services/authorization.service';
import { decimalLabel } from '../../../services/service-pricing.models';
import { Service } from '../../../services/servicios.service';
import { PetSize, ServicePrice, TarifasService } from '../../../services/tarifas.service';
import { ModalComponent } from '../../ui/modal/modal.component';

interface SizePriceRow {
  size: PetSize;
  label: string;
  price: string;
  duration: number | string;
  saved: ServicePrice | null;
  editing: boolean;
}

const SIZES: Array<{ size: PetSize; label: string }> = [
  { size: 'TOY', label: 'Miniatura' },
  { size: 'SMALL', label: 'Pequeño' },
  { size: 'MEDIUM', label: 'Mediano' },
  { size: 'LARGE', label: 'Grande' },
  { size: 'EXTRA_LARGE', label: 'Extra grande' },
];

@Component({
  selector: 'app-service-pricing-editor',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './service-pricing-editor.component.html',
})
export class ServicePricingEditorComponent implements OnChanges {
  @Input() service: Service | null = null;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  readonly authorization = inject(AuthorizationService);
  private readonly prices = inject(TarifasService);
  private revision = 0;
  readonly rows = signal<SizePriceRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly busySize = signal<PetSize | null>(null);
  readonly moneyLabel = decimalLabel;

  ngOnChanges(): void {
    if (this.open && this.service) void this.load();
  }

  close(): void {
    if (!this.busySize()) this.closed.emit();
  }

  edit(row: SizePriceRow): void {
    if (!this.authorization.has('service_prices.manage')) return;
    row.price = row.saved?.price ?? this.service?.base_price ?? '';
    row.duration = row.saved?.duration_minutes ?? this.service?.base_duration_minutes ?? '';
    row.editing = true;
    this.error.set('');
    this.rows.update(rows => [...rows]);
  }

  cancel(row: SizePriceRow): void {
    row.editing = false;
    this.rows.update(rows => [...rows]);
  }

  async save(row: SizePriceRow): Promise<void> {
    if (!this.service || this.busySize() || !this.authorization.has('service_prices.manage')) return;
    this.busySize.set(row.size);
    this.error.set('');
    try {
      await this.prices.saveForSize(this.service.id, row.size, row.price, row.duration);
      await this.load();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo guardar la tarifa.');
    } finally {
      this.busySize.set(null);
    }
  }

  async useBase(row: SizePriceRow): Promise<void> {
    if (!this.service || !row.saved || this.busySize() || !this.authorization.has('service_prices.manage')) return;
    this.busySize.set(row.size);
    this.error.set('');
    try {
      await this.prices.removeForSize(this.service.id, row.size);
      await this.load();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo retirar la tarifa.');
    } finally {
      this.busySize.set(null);
    }
  }

  private async load(): Promise<void> {
    const service = this.service;
    if (!service) return;
    const revision = ++this.revision;
    this.loading.set(true);
    this.error.set('');
    try {
      const saved = await this.prices.forService(service.id);
      if (revision !== this.revision) return;
      this.rows.set(SIZES.map(size => {
        const price = saved.find(row => row.pet_size === size.size) ?? null;
        return {
          ...size,
          price: price?.price ?? service.base_price,
          duration: price?.duration_minutes ?? service.base_duration_minutes,
          saved: price,
          editing: false,
        };
      }));
    } catch (error) {
      if (revision === this.revision) this.error.set(error instanceof Error ? error.message : 'No se pudieron cargar las tarifas.');
    } finally {
      if (revision === this.revision) this.loading.set(false);
    }
  }
}
