import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Client, ClientesService } from '../../shared/services/clientes.service';
import { MascotasService, Pet, PetSize } from '../../shared/services/mascotas.service';
import { Service, ServiciosService } from '../../shared/services/servicios.service';
import { ServiceQuote, TarifasService } from '../../shared/services/tarifas.service';
import { decimalLabel } from '../../shared/services/service-pricing.models';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [],
  templateUrl: './catalog.component.html',
})
export class ServiceCatalogComponent implements OnInit {
  private readonly catalogue = inject(ServiciosService);
  private readonly clients = inject(ClientesService);
  private readonly petsService = inject(MascotasService);
  private readonly pricing = inject(TarifasService);
  private revision = 0;

  readonly loading = signal(true);
  readonly error = signal('');
  readonly petNotice = signal('');
  readonly services = signal<Service[]>([]);
  readonly selectableServices = computed(() => this.services().filter(service => service.kind === 'MAIN' || service.can_sell_alone));
  readonly addonPairs = signal<Array<{addon_id:string;main_id:string}>>([]);
  readonly selectedAddonIds = signal<string[]>([]);
  readonly availableAddons = computed(() => this.services().filter(service => service.kind === 'ADD_ON' &&
    this.addonPairs().some(pair => pair.main_id === this.selectedServiceId() && pair.addon_id === service.id)));
  readonly quoteLines = signal<Array<{name:string;price:string;max_price:string;duration_minutes:number}>>([]);
  readonly pets = signal<Pet[]>([]);
  readonly selectedServiceId = signal('');
  readonly selectedPetId = signal('');
  readonly size = signal<PetSize | null>(null);
  readonly calculating = signal(false);
  readonly calculationError = signal('');
  readonly result = signal<ServiceQuote | null>(null);
  readonly selectedService = computed(() => this.services().find(service => service.id === this.selectedServiceId()) ?? null);
  readonly moneyLabel = decimalLabel;

  async ngOnInit(): Promise<void> {
    try {
      const services = await this.catalogue.getAll(true);
      this.services.set(services.filter(service => service.active && service.visible_to_clients)
        .sort((a,b) => (a.kind === 'MAIN' ? 0 : 1) - (b.kind === 'MAIN' ? 0 : 1)));
      this.addonPairs.set(await this.catalogue.allowedAddons());
    } catch {
      this.error.set('No pudimos cargar los servicios. Vuelve a intentarlo más tarde.');
    } finally {
      this.loading.set(false);
    }

    try {
      const own = await this.clients.own({ search: '', page: 1, size: 1 });
      const client: Client | undefined = own.rows[0];
      if (!client) return;
      const pets: Pet[] = [];
      for (let page = 1; ; page++) {
        const found = await this.petsService.search({ search: '', page, size: 100 }, false, client.id);
        pets.push(...found.rows.filter(pet => pet.active));
        if (page * 100 >= found.total || found.rows.length === 0) break;
      }
      this.pets.set(pets);
    } catch {
      this.petNotice.set('No pudimos cargar tus mascotas. Puedes indicar el tamaño manualmente.');
    }
  }

  selectService(id: string): void {
    this.selectedServiceId.set(id);
    this.selectedAddonIds.set([]);
    this.invalidate();
  }

  toggleAddon(id:string):void {
    if(!this.availableAddons().some(service=>service.id===id))return;
    this.selectedAddonIds.update(ids=>ids.includes(id)?ids.filter(current=>current!==id):[...ids,id]);
    this.invalidate();
  }

  selectPet(id: string): void {
    this.selectedPetId.set(id);
    const pet = this.pets().find(item => item.id === id);
    this.size.set(pet?.pet_size ?? null);
    this.invalidate();
  }

  setSize(value: string): void { this.size.set(value ? value as PetSize : null); this.invalidate(); }

  async calculate(): Promise<void> {
    if (!this.selectedServiceId() || this.calculating()) return;
    const revision = ++this.revision;
    this.calculating.set(true);
    this.result.set(null);
    this.calculationError.set('');
    try {
      const selected=[this.selectedServiceId(),...this.selectedAddonIds()];
      const quoted=await Promise.all(selected.map(id=>this.pricing.quote(id,this.size())));
      if (revision === this.revision) {
        const lines=quoted.map((quote,index)=>({name:this.services().find(service=>service.id===selected[index])?.name??'Servicio',
          price:quote.price,max_price:quote.max_price??quote.price,duration_minutes:quote.duration_minutes}));
        const total=(field:'price'|'max_price')=>{
          const cents=lines.reduce((sum,line)=>{
            const [whole,fraction='']=line[field].split('.');
            return sum+BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
          },0n);
          return `${cents/100n}.${String(cents%100n).padStart(2,'0')}`;
        };
        this.quoteLines.set(lines);
        this.result.set({...quoted[0],price:total('price'),max_price:total('max_price'),
          duration_minutes:lines.reduce((sum,line)=>sum+line.duration_minutes,0)});
      }
    } catch {
      if (revision === this.revision) this.calculationError.set('No pudimos calcular esta tarifa. Revisa el servicio e inténtalo de nuevo.');
    } finally {
      if (revision === this.revision) this.calculating.set(false);
    }
  }

  private invalidate(): void {
    this.revision++;
    this.result.set(null);
    this.quoteLines.set([]);
    this.calculationError.set('');
    this.calculating.set(false);
  }
}
