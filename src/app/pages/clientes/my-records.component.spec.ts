import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClientesService } from '../../shared/services/clientes.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { RecordsService } from '../../shared/services/records.service';
import { MyRecordsComponent } from './my-records.component';

describe('Consulta propia de datos y mascotas', () => {
  let own: jasmine.Spy;
  let searchPets: jasmine.Spy;
  let dewormings: jasmine.Spy;

  beforeEach(() => {
    own = jasmine.createSpy().and.resolveTo({ rows: [{ id: 'client-1', first_name: 'Lucía', last_name: 'Herrera' }], total: 1 });
    searchPets = jasmine.createSpy().and.resolveTo({ rows: [{ id: 'pet-1', client_id: 'client-1', name: 'Luna', breed: 'Poodle', pet_size: 'SMALL', active: true, allergies: false, client_notes: 'Sin problemas.' }], total: 1 });
    dewormings = jasmine.createSpy().and.resolveTo([{ id: 'deworming-1', treatment: 'Tratamiento de prueba', applied_on: '2026-01-01', next_due_on: null }]);
    TestBed.configureTestingModule({
      imports: [MyRecordsComponent],
      providers: [
        provideRouter([]),
        { provide: ClientesService, useValue: { own } },
        { provide: MascotasService, useValue: { search: searchPets } },
        { provide: RecordsService, useValue: { dewormings } },
      ],
    });
  });

  it('muestra solo la ficha vinculada y sus mascotas sin controles internos', async () => {
    const fixture = TestBed.createComponent(MyRecordsComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    expect(own).toHaveBeenCalledWith({ search: '', page: 1, size: 1 });
    expect(searchPets).toHaveBeenCalledWith({ search: '', page: 1, size: 100 }, false, 'client-1');
    expect(fixture.nativeElement.textContent).toContain('Lucía Herrera');
    expect(fixture.nativeElement.textContent).toContain('Luna');
    expect(fixture.nativeElement.textContent).not.toContain('Notas internas');
    await fixture.componentInstance.showPet(fixture.componentInstance.pets()[0]);
    await fixture.whenStable();
    expect(dewormings).toHaveBeenCalledOnceWith('pet-1');
    expect(fixture.nativeElement.textContent).toContain('Tratamiento de prueba');
  });

  it('explica cuando la cuenta todavía no tiene ficha vinculada', async () => {
    own.and.resolveTo({ rows: [], total: 0 });
    const fixture = TestBed.createComponent(MyRecordsComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay una ficha vinculada');
    expect(searchPets).not.toHaveBeenCalled();
  });
});
