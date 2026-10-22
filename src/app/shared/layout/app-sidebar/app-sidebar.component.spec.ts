import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppSidebarComponent } from './app-sidebar.component';
import { SalesService } from '../../services/sales.service';
import { AuthorizationService } from '../../services/authorization.service';
describe('Menú de agenda por permiso',()=>{
 let allowed:Set<string>;
 beforeEach(()=>{allowed=new Set(['panel.access']);TestBed.configureTestingModule({imports:[AppSidebarComponent],providers:[provideRouter([]),{provide:SalesService,useValue:{search:async()=>({rows:[],total:0})}},{provide:AuthorizationService,useValue:{has:(p:string)=>allowed.has(p)}}]});});
 it('oculta Calendario y el grupo vacío Citas si falta appointments.read',()=>{
  const c=TestBed.createComponent(AppSidebarComponent).componentInstance;
  expect(c.visibleNavItems.some(item=>item.subItems?.some(s=>s.path==='/calendario'))).toBeFalse();
  expect(c.visibleNavItems.some(item=>item.name==='Citas')).toBeFalse();expect(c.visibleNavItems.some(item=>item.path==='/calendar')).toBeTrue();
 });
 it('STAFF con lectura ve Citas y conserva otros subitems autorizados',()=>{
  allowed.add('appointments.read');const c=TestBed.createComponent(AppSidebarComponent).componentInstance;
  expect(c.visibleNavItems.some(item=>item.subItems?.some(s=>s.path==='/calendario'))).toBeTrue();
  expect(c.visibleNavItems.some(item=>item.subItems?.some(s=>s.path==='/panel'))).toBeTrue();
 });
});
