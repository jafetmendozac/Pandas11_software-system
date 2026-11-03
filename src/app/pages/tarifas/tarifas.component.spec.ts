import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarifasComponent } from './tarifas.component';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ServiciosService } from '../../shared/services/servicios.service';
import { TarifasService } from '../../shared/services/tarifas.service';

describe('Tarifas de solo lectura', () => {
  it('presenta el nombre incluido en la consulta y conserva el UUID como valor del formulario', async () => {
    const serviceId = 'd0400000-0000-4000-8000-000000000301';
    const prices = { search: jasmine.createSpy().and.resolveTo({
      rows: [{ id: 'tarifa', service_id: serviceId, service_name: 'DEMO Baño',
        pet_size: null, pet_coat_type: null, price: '40.00', duration_minutes: 60 }], total: 1,
    }) };
    const services = { getAll: jasmine.createSpy().and.resolveTo([]) };
    TestBed.configureTestingModule({
      imports: [TarifasComponent],
      providers: [provideRouter([]),
        { provide: AuthorizationService, useValue: { has: (permission: string) => permission.endsWith('.read') } },
        { provide: ServiciosService, useValue: services },
        { provide: TarifasService, useValue: prices }],
    });
    const fixture = TestBed.createComponent(TarifasComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const serviceColumn = fixture.componentInstance.columns.find(column => column.key === 'service_id');
    expect(serviceColumn?.options).toContain({ label: 'DEMO Baño', value: serviceId });
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('DEMO Baño');
    expect(fixture.nativeElement.querySelector('tbody').textContent).not.toContain(serviceId);
    expect(services.getAll).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain('Añadir tarifa');
  });
});
