import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { RecordsService } from '../../shared/services/records.service';
import { PetDetailComponent } from './pet-detail.component';

const route = (id: string | null) => ({
  snapshot: {
    paramMap: { get: (key: string) => key === 'id' ? id : null },
    queryParamMap: { get: (key: string) => key === 'q' ? 'Luna' : key === 'page' ? '2' : key === 'archived' ? '1' : null },
  },
});

describe('PetDetailComponent', () => {
  const pet = { id: 'pet-1', client_id: 'client-1', name: 'Luna', breed_name: 'Poodle', pet_size: 'SMALL', weight_kg: 4.5, allergies: true, bites: false, active: true, client_name: 'Ana Pérez' };

  beforeEach(() => TestBed.configureTestingModule({
    imports: [PetDetailComponent],
    providers: [
      provideRouter([]),
      { provide: AuthorizationService, useValue: { has: (permission: string) => permission === 'vaccinations.read' } },
      { provide: RecordsService, useValue: { vaccinations: jasmine.createSpy().and.resolveTo([]), note: jasmine.createSpy().and.resolveTo(null) } },
    ],
  }));

  it('carga la mascota de la ruta y presenta un retorno con el contexto del listado', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: route('pet-1') });
    const pets = { get: jasmine.createSpy().and.resolveTo(pet) };
    TestBed.overrideProvider(MascotasService, { useValue: pets });
    const fixture = TestBed.createComponent(PetDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pets.get).toHaveBeenCalledWith('pet-1', true);
    expect(fixture.nativeElement.textContent).toContain('Mascota de Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Alergias');
    expect(fixture.componentInstance.returnQueryParams).toEqual({ q: 'Luna', page: '2', archived: '1' });
  });

  it('no revela datos cuando la mascota no está disponible', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: route('missing') });
    TestBed.overrideProvider(MascotasService, { useValue: { get: jasmine.createSpy().and.resolveTo(null) } });
    const fixture = TestBed.createComponent(PetDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La mascota no existe o no tienes permiso para verla.');
    expect(fixture.nativeElement.textContent).not.toContain('Mascota de Ana Pérez');
  });
});
