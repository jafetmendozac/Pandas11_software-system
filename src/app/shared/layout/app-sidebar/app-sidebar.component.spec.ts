import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AppSidebarComponent } from './app-sidebar.component';
import { SalesService } from '../../services/sales.service';
import { AuthorizationService } from '../../services/authorization.service';
@Component({template: ''})
class EmptyPage {}
describe('Menú de agenda por permiso',()=>{
 let allowed:Set<string>;
 let roleCode:string;
 beforeEach(()=>{allowed=new Set(['panel.access']);roleCode='STAFF';TestBed.configureTestingModule({imports:[AppSidebarComponent],providers:[provideRouter([{path:'calendario',component:EmptyPage},{path:'clientes',component:EmptyPage}]),{provide:SalesService,useValue:{search:async()=>({rows:[],total:0})}},{provide:AuthorizationService,useValue:{has:(p:string)=>allowed.has(p),hasInSelectedRole:(p:string)=>allowed.has(p),selectedRole:()=>({code:roleCode,permissions:[...allowed]})}}]});});
 it('muestra reportes solo a OWNER o ADMIN con permiso de analítica',()=>{
  allowed.add('analytics.read');
  const c=TestBed.createComponent(AppSidebarComponent).componentInstance;
  expect(c.visibleNavItems.some(item=>item.path==='/reportes')).toBeFalse();
  roleCode='ADMIN';
  expect(c.visibleNavItems.some(item=>item.path==='/reportes')).toBeTrue();
 });
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
 it('ordena las páginas de trabajo antes de los ejemplos',()=>{
  allowed.add('appointments.read'); allowed.add('clients.read');
  const names=TestBed.createComponent(AppSidebarComponent).componentInstance.visibleNavItems.map(item=>item.name);
  expect(names.indexOf('Inicio')).toBeLessThan(names.indexOf('Citas'));
  expect(names.indexOf('Citas')).toBeLessThan(names.indexOf('Clientes'));
  expect(names.indexOf('Clientes')).toBeLessThan(names.indexOf('Forms'));
 });
 it('solo resalta el grupo de la ruta actual y cierra el anterior al navegar',async()=>{
  allowed.add('appointments.read'); allowed.add('clients.read');
  const fixture=TestBed.createComponent(AppSidebarComponent);
  fixture.detectChanges();
  const sidebar=fixture.componentInstance;
  const router=TestBed.inject(Router);
  await router.navigateByUrl('/calendario'); fixture.detectChanges();
  const citas=sidebar.visibleNavItems.find(item=>item.name==='Citas')!;
  expect(sidebar.isGroupActive(citas)).toBeTrue();
  expect(sidebar.openSubmenu).toBe(sidebar.submenuKey('main',citas));
  await router.navigateByUrl('/clientes'); fixture.detectChanges();
  expect(sidebar.isGroupActive(citas)).toBeFalse();
  expect(sidebar.openSubmenu).toBeNull();
  sidebar.toggleSubmenu('main',citas);
  expect(sidebar.isGroupActive(citas)).toBeFalse();
 });
});
