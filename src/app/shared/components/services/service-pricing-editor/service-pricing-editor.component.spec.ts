import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../../services/authorization.service';
import { TarifasService } from '../../../services/tarifas.service';
import { ServicePricingEditorComponent } from './service-pricing-editor.component';

describe('Editor unificado de tarifas', () => {
  let manage = true;
  let pricing: { forService: jasmine.Spy; saveForSize: jasmine.Spy; removeForSize: jasmine.Spy };

  beforeEach(() => {
    manage = true;
    pricing = {
      forService: jasmine.createSpy().and.resolveTo([{ id: 'price', service_id: 'service', service_name: '', pet_size: 'SMALL', price: '50.00', duration_minutes: 45 }]),
      saveForSize: jasmine.createSpy().and.resolveTo(),
      removeForSize: jasmine.createSpy().and.resolveTo(),
    };
    TestBed.configureTestingModule({
      imports: [ServicePricingEditorComponent],
      providers: [
        { provide: TarifasService, useValue: pricing },
        { provide: AuthorizationService, useValue: { has: (permission: string) => permission === 'service_prices.manage' && manage } },
      ],
    });
  });

  it('muestra cinco tamaños y usa base donde no existe tarifa', async () => {
    manage = false;
    const fixture = TestBed.createComponent(ServicePricingEditorComponent);
    fixture.componentRef.setInput('service', { id: 'service', name: 'Baño', base_price: '40.00', base_duration_minutes: 60 });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.rows().length).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('S/ 50.00 · 45 minutos');
    expect(fixture.nativeElement.textContent).toContain('S/ 40.00 · 60 minutos');
    expect(fixture.nativeElement.textContent).not.toContain('Raza');
    expect(fixture.nativeElement.textContent).not.toContain('Personalizar');
  });

  it('guarda una tarifa para el tamaño elegido', async () => {
    const fixture = TestBed.createComponent(ServicePricingEditorComponent);
    fixture.componentRef.setInput('service', { id: 'service', name: 'Baño', base_price: '40.00', base_duration_minutes: 60 });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const toy = fixture.componentInstance.rows().find(row => row.size === 'TOY')!;
    fixture.componentInstance.edit(toy);
    toy.price = '42.50';
    toy.duration = 55;
    await fixture.componentInstance.save(toy);

    expect(pricing.saveForSize).toHaveBeenCalledOnceWith('service', 'TOY', '42.50', 55);
  });
});
