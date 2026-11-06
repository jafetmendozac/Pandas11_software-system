import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { RecordDetailsComponent } from '../../shared/components/records/record-details/record-details.component';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService } from '../../shared/services/clientes.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { PetBreedsService } from '../../shared/services/pet-breeds.service';
import { RecordsService } from '../../shared/services/records.service';
import { ClientDetailComponent } from './client-detail.component';

const route = (id: string | null) => ({
  snapshot: {
    paramMap: { get: (key: string) => key === 'id' ? id : null },
    queryParamMap: { get: (key: string) => key === 'q' ? 'Lucía' : key === 'page' ? '2' : key === 'archived' ? '1' : null },
  },
});

describe('ClientDetailComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ClientDetailComponent],
    providers: [
      provideRouter([]),
      { provide: AuthorizationService, useValue: { has: (permission: string) => permission === 'pets.manage' || permission === 'internal.read' } },
      { provide: RecordsService, useValue: { vaccinations: jasmine.createSpy().and.resolveTo([]), note: jasmine.createSpy().and.resolveTo(null) } },
    ],
  }));

  it('carga la ficha y las mascotas del cliente de la ruta', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: route('client-1') });
    const clients = { get: jasmine.createSpy().and.resolveTo({ id: 'client-1', first_name: 'Lucía', last_name: 'Herrera', phone: '999', whatsapp: null, email: null, address: null, tax_doc_type: null, tax_doc_number: null, whatsapp_opt_in: true }) };
    const pets = { search: jasmine.createSpy().and.resolveTo({ rows: [{ id: 'pet-1', name: 'Luna', client_id: 'client-1' }], total: 1 }) };
    TestBed.overrideProvider(ClientesService, { useValue: clients });
    TestBed.overrideProvider(MascotasService, { useValue: pets });
    TestBed.overrideProvider(PetBreedsService, { useValue: { getAll: jasmine.createSpy().and.resolveTo([{ id: 'breed-1', name: 'Mestiza', active: true }]) } });
    const fixture = TestBed.createComponent(ClientDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(clients.get).toHaveBeenCalledWith('client-1', true);
    expect(pets.search).toHaveBeenCalledWith({ search: '', page: 1, size: 10 }, true, 'client-1');
    expect(fixture.nativeElement.textContent).toContain('Datos de contacto y preferencias del cliente');
    expect(fixture.nativeElement.textContent).toContain('Mascotas');
    expect(fixture.componentInstance.returnQueryParams).toEqual({ q: 'Lucía', page: '2', archived: '1' });

    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.openPet({ id: 'pet-1' });
    expect(navigate).toHaveBeenCalledWith(['/mascotas', 'pet-1'], { queryParams: { fromClient: 'client-1', q: 'Lucía', page: '2', archived: '1' } });
  });

  it('muestra un error sin detalles si el cliente no está disponible', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: route('missing') });
    TestBed.overrideProvider(ClientesService, { useValue: { get: jasmine.createSpy().and.resolveTo(null) } });
    TestBed.overrideProvider(MascotasService, { useValue: { search: jasmine.createSpy() } });
    TestBed.overrideProvider(PetBreedsService, { useValue: { getAll: jasmine.createSpy() } });
    const fixture = TestBed.createComponent(ClientDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El cliente no existe o no tienes permiso para verlo.');
    expect(fixture.nativeElement.textContent).not.toContain('Datos de contacto y preferencias del cliente');
  });
});
