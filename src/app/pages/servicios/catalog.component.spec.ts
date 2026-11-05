import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClientesService } from '../../shared/services/clientes.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { PetBreedsService } from '../../shared/services/pet-breeds.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ServiciosService } from '../../shared/services/servicios.service';
import { TarifasService } from '../../shared/services/tarifas.service';
import { ServiceCatalogComponent } from './catalog.component';

const mockSupabase = { client: { from: () => ({ select: () => ({ ilike: () => ({ order: () => ({ range: () => Promise.resolve({ data: [], error: null, count: 0 }) }) }) }) }) } };

describe('Catálogo para clientes', () => {
  let quote: jasmine.Spy;
  let getAll: jasmine.Spy;

  beforeEach(() => {
    quote = jasmine.createSpy().and.resolveTo({ price: '55.00', duration_minutes: 60 });
    getAll = jasmine.createSpy().and.resolveTo([
      { id: 'bath', name: 'Baño', description: 'Cuidado de pelaje', active: true, visible_to_clients: true },
      { id: 'internal', name: 'Interno', active: true, visible_to_clients: false },
    ]);
    TestBed.configureTestingModule({
      imports: [ServiceCatalogComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: PetBreedsService, useValue: { getAll: async () => [{ id: '00000000-0000-4000-8000-000000000001', name: 'Poodle', active: true }] } },
        { provide: ServiciosService, useValue: { getAll } },
        { provide: ClientesService, useValue: { own: () => Promise.resolve({ rows: [{ id: 'client-1' }], total: 1 }) } },
        { provide: MascotasService, useValue: { search: () => Promise.resolve({ rows: [{ id: 'pet-1', name: 'Luna', active: true, pet_size: 'SMALL', breed_id: '00000000-0000-4000-8000-000000000001' }], total: 1 }) } },
        { provide: TarifasService, useValue: { quote } },
      ],
    });
  });

  it('muestra solo catálogo visible y cotiza con las dimensiones de la mascota propia', async () => {
    const fixture = TestBed.createComponent(ServiceCatalogComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    expect(getAll).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.textContent).toContain('Baño');
    expect(fixture.nativeElement.textContent).not.toContain('Interno');

    fixture.componentInstance.selectService('bath');
    fixture.componentInstance.selectPet('pet-1');
    await fixture.componentInstance.calculate();
    await fixture.whenStable();
    expect(quote).toHaveBeenCalledOnceWith('bath', 'SMALL', '00000000-0000-4000-8000-000000000001');
    expect(fixture.nativeElement.textContent).toContain('S/ 55.00 · 60 minutos');
  });

  it('descarta una cotización anterior al cambiar de mascota', async () => {
    let finishQuote!: (value: { price: string; duration_minutes: number }) => void;
    quote.and.returnValue(new Promise(resolve => { finishQuote = resolve; }));
    const fixture = TestBed.createComponent(ServiceCatalogComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    fixture.componentInstance.selectService('bath');
    fixture.componentInstance.selectPet('pet-1');
    const pending = fixture.componentInstance.calculate();
    fixture.componentInstance.selectPet('');
    finishQuote({ price: '55.00', duration_minutes: 60 });
    await pending;

    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.componentInstance.calculating()).toBeFalse();
  });
});
