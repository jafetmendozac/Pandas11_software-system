import { TestBed } from '@angular/core/testing';
import { CajaComponent } from './caja.component';
import { CommercialService } from '../../shared/services/commercial.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { CashSession } from '../../shared/services/commercial.models';

describe('Caja',()=>{
  let component:CajaComponent;
  let api:jasmine.SpyObj<CommercialService>;
  const open={id:'session',status:'OPEN',version:1,expected_cash:'10.00'} as CashSession;
  beforeEach(()=>{
    api=jasmine.createSpyObj('CommercialService',['cashOverview','cashSessions','cashMovements','openCash','recordCash','closeCash']);
    api.cashOverview.and.resolveTo(null);api.cashSessions.and.resolveTo({rows:[],total:0});api.cashMovements.and.resolveTo({rows:[],total:0});
    TestBed.configureTestingModule({providers:[{provide:CommercialService,useValue:api},{provide:AuthorizationService,useValue:{has:()=>true}}]});
    component=TestBed.runInInjectionContext(()=>new CajaComponent());
  });
  it('rechaza importes fraccionarios antes de abrir',async()=>{
    component.opening='1.234';await component.open();expect(api.openCash).not.toHaveBeenCalled();
  });
  it('conserva el UUID de apertura tras una red ambigua',async()=>{
    api.openCash.and.rejectWith(new Error('network'));await component.open();
    const request=api.openCash.calls.mostRecent().args[1];
    api.openCash.and.resolveTo(open);await component.open();
    expect(api.openCash.calls.mostRecent().args[1]).toBe(request);
  });
  it('no permite retiro manual sin motivo',async()=>{
    component.session.set(open);component.amount='2';component.reason=' ';component.source='MANUAL_OUT';
    await component.record();expect(api.recordCash).not.toHaveBeenCalled();
  });
});
