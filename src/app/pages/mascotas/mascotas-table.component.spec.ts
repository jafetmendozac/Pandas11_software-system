import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService } from '../../shared/services/clientes.service';
import { MascotasService } from '../../shared/services/mascotas.service';
import { PetBreedsService } from '../../shared/services/pet-breeds.service';
import { MascotasTableComponent } from './mascotas-table.component';

describe('MascotasTableComponent: formulario', () => {
  it('muestra una sola raza y los tres campos booleanos como radio', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthorizationService, useValue: { has: () => true } },
        { provide: ClientesService, useValue: { getAll: async () => [] } },
        { provide: PetBreedsService, useValue: { getAll: async () => [{ id: 'breed-1', name: 'Pomerania' }] } },
        { provide: MascotasService, useValue: { search: async () => ({ rows: [], total: 0 }) } },
      ],
    });
    const fixture = TestBed.createComponent(MascotasTableComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const columns = fixture.componentInstance.columns;
    expect(columns.filter(column => column.label === 'Raza').map(column => column.key)).toEqual(['breed_id']);
    expect(columns.find(column => column.key === 'breed_id')?.options?.[1]).toEqual({ label: 'Pomerania', value: 'breed-1' });
    expect(columns.filter(column => column.control === 'radio').map(column => column.key))
      .toEqual(['allergies', 'bites', 'active']);
  });
});
