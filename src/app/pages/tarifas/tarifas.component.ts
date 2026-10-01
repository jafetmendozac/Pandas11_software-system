import { Component, OnInit, signal } from '@angular/core';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PersonalizedTable, TableColumn, TableRow } from '../../shared/components/tables/basic-tables/personalize-table/personalized-table.component';
import { Service, ServiciosService } from '../../shared/services/servicios.service';
import { ServicePrice, TarifasService } from '../../shared/services/tarifas.service';

@Component({
  selector: 'app-tarifas',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    PersonalizedTable,
  ],
  templateUrl: './tarifas.component.html',
  styles: ``
})
export class TarifasComponent implements OnInit {
  tableData = signal<ServicePrice[]>([]);
  errorMessage = signal('');
  loading = signal(true);

  columns: TableColumn[] = [
    {
      key: 'service_id',
      label: 'Servicio',
      helpText: 'Selecciona el servicio al que aplica esta tarifa.',
      options: [],
    },
    {
      key: 'pet_size',
      label: 'Tamaño',
      helpText: 'Define el tamaño de la mascota.',
      options: [
        { label: 'Pequeño', value: 'SMALL' },
        { label: 'Mediano', value: 'MEDIUM' },
        { label: 'Grande', value: 'LARGE' },
        { label: 'Extra grande', value: 'EXTRA_LARGE' },
      ],
    },
    {
      key: 'pet_coat_type',
      label: 'Tipo de pelo',
      helpText: 'Define el tipo de pelaje de la mascota.',
      options: [
        { label: 'Corto', value: 'SHORT' },
        { label: 'Medio', value: 'MEDIUM' },
        { label: 'Largo', value: 'LONG' },
        { label: 'Cerda', value: 'WIRE' },
        { label: 'Rizado', value: 'CURLY' },
        { label: 'Sin pelo', value: 'HAIRLESS' },
      ],
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      placeholder: 'Ej. 75',
      helpText: 'Ingresa el precio en soles.',
    },
    {
      key: 'duration_minutes',
      label: 'Duración (min)',
      type: 'number',
      placeholder: 'Ej. 60',
      helpText: 'Indica la duración aproximada en minutos.',
    },
  ];

  constructor(
    private readonly tarifasService: TarifasService,
    private readonly serviciosService: ServiciosService,
  ) {}

  async ngOnInit() { 
    await this.loadTarifas();
  }

  private async loadTarifas(): Promise<void> {
    this.loading.set(true)
    this.errorMessage.set('');
    try {
      const [prices, services] = await Promise.all([
        this.tarifasService.getAll(),
        this.serviciosService.getAll(),
      ]);
      const serviceNames = new Map(services.map((service) => [service.id, service.name]));
      this.tableData.set(prices.map((price) => ({
        ...price,
        service_name: serviceNames.get(price.service_id) ?? 'Servicio no encontrado',
      })));
      this.columns = this.columns.map((column) =>
        column.key === 'service_id'
          ? { ...column, options: this.toServiceOptions(services) }
          : { ...column },
      );
    } catch (error) {
      console.error('No se pudieron cargar las tarifas.', error);
      this.errorMessage.set(error instanceof Error
        ? error.message
        : 'No se pudieron cargar las tarifas.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async createPrice(transaction: TableRow) {
    await this.tarifasService.create(transaction);
    await this.loadTarifas();
  }

  async deletePrice(transaction: TableRow) {
    await this.tarifasService.remove(transaction);
    await this.loadTarifas();
  }

  async updatePrice(transaction: TableRow) {
    await this.tarifasService.update(transaction);
    await this.loadTarifas();
  }

  private toServiceOptions(services: Service[]): Array<{ label: string; value: string }> {
    return services.map((service) => ({
      label: service.name || 'Servicio sin nombre',
      value: service.id,
    }));
  }
}
