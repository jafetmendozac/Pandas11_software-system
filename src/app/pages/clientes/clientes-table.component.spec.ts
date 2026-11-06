import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ClientesService } from '../../shared/services/clientes.service';
import { ProfilesService } from '../../shared/services/profiles.service';
import { ClientesTableComponent } from './clientes-table.component';

describe('ClientesTableComponent: ficha por ruta', () => {
  it('abre la ficha del cliente y conserva el contexto del listado', () => {
    TestBed.configureTestingModule({
      imports: [ClientesTableComponent],
      providers: [
        provideRouter([]),
        { provide: AuthorizationService, useValue: { has: () => true } },
        { provide: ClientesService, useValue: { search: jasmine.createSpy(), own: jasmine.createSpy() } },
        { provide: ProfilesService, useValue: { getAll: jasmine.createSpy() } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ClientesTableComponent);
    fixture.componentInstance.query = { search: 'Lucía', page: 2, size: 10 };
    fixture.componentInstance.openPets({ id: 'client-1' });

    expect(navigate).toHaveBeenCalledWith(['/clientes', 'client-1'], { queryParams: { q: 'Lucía', page: 2, archived: undefined } });
  });
});
