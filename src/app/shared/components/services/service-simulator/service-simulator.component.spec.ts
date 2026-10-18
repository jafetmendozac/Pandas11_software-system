import { TestBed } from '@angular/core/testing';
import { ServiceSimulatorComponent } from './service-simulator.component';
import { ServiciosService } from '../../../services/servicios.service';
import { TarifasService, ServiceQuote } from '../../../services/tarifas.service';
describe('Simulador de precios',()=>{
  let pricing:{quote:jasmine.Spy};
  beforeEach(()=>{
    pricing={quote:jasmine.createSpy().and.resolveTo({service_id:'service',price:'0',duration_minutes:45,source:'SIZE_COAT',rule_id:'rule'})};
    TestBed.configureTestingModule({imports:[ServiceSimulatorComponent],providers:[
      {provide:ServiciosService,useValue:{getAll:async()=>[{id:'service',name:'Baño',active:true,visible_to_clients:true},{id:'hidden',name:'Oculto',active:true,visible_to_clients:false}]}},
      {provide:TarifasService,useValue:pricing},
    ]});
  });
  it('muestra precio cero, duración y origen devueltos por SQL',async()=>{
    const f=TestBed.createComponent(ServiceSimulatorComponent);f.detectChanges();await f.whenStable();
    f.componentInstance.serviceId='service';f.componentInstance.size='TOY';f.componentInstance.coat='LONG';
    await f.componentInstance.calculate();f.detectChanges();
    expect(pricing.quote).toHaveBeenCalledWith('service','TOY','LONG');
    expect(f.nativeElement.textContent).toContain('0.00');expect(f.nativeElement.textContent).toContain('45 minutos');expect(f.nativeElement.textContent).toContain('Tamaño y pelaje');
  });
  it('catálogo propio solo ofrece servicios visibles',async()=>{
    const f=TestBed.createComponent(ServiceSimulatorComponent);f.componentRef.setInput('publicOnly',true);f.detectChanges();await f.whenStable();
    expect(f.componentInstance.services().map(s=>s.id)).toEqual(['service']);
  });
  it('descarta una respuesta si cambian dimensiones durante la consulta',async()=>{
    const f=TestBed.createComponent(ServiceSimulatorComponent);f.detectChanges();await f.whenStable();
    let resolve!:(quote:ServiceQuote)=>void;pricing.quote.and.callFake(()=>new Promise(r=>resolve=r));f.componentInstance.serviceId='service';
    const pending=f.componentInstance.calculate();f.componentInstance.size='TOY';f.componentInstance.invalidate();
    resolve({service_id:'service',price:'1',duration_minutes:30,source:'BASE',rule_id:null});await pending;
    expect(f.componentInstance.quote()).toBeNull();expect(f.componentInstance.calculating()).toBeFalse();
  });
  it('sin dimensiones envía NULL y limpia resultado si el servicio es denegado',async()=>{
    const f=TestBed.createComponent(ServiceSimulatorComponent);f.detectChanges();await f.whenStable();f.componentInstance.serviceId='service';
    pricing.quote.and.rejectWith(new Error('No disponible'));await f.componentInstance.calculate();
    expect(pricing.quote).toHaveBeenCalledWith('service',null,null);expect(f.componentInstance.quote()).toBeNull();expect(f.componentInstance.error()).toBe('No disponible');
  });
});
