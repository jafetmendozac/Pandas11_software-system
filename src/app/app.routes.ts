import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { ConfirmEmailComponent } from './pages/auth-pages/confirm-email/confirm-email.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { CalendarioComponent } from './pages/agenda/calendario.component';
import { ClientesTableComponent } from './pages/clientes/clientes-table.component';
import { MascotasTableComponent } from './pages/mascotas/mascotas-table.component';
import { ServiciosComponent } from './pages/servicios/servicios.component';
import { TarifasComponent } from './pages/tarifas/tarifas.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { authGuard, profileGuard } from './shared/guards/auth.guard';

import { salesGuard } from './shared/guards/sales.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent), title: 'Spa Boutique Pandas 11 | Bienestar y estilo canino en Trujillo' },
  { path: 'access-denied', loadComponent: () => import('./pages/auth-pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent), title: 'Acceso no autorizado' },
  { path: 'catalogo', loadComponent: () => import('./pages/servicios/catalog.component').then(m => m.ServiceCatalogComponent), canActivate: [profileGuard], title: 'Servicios y precios' },
  { path: 'mis-datos', loadComponent: () => import('./pages/clientes/my-records.component').then(m => m.MyRecordsComponent), canActivate: [profileGuard], title: 'Mis datos y mascotas' },
  { path: 'mi-perfil', component: ProfileComponent, canActivate: [profileGuard], title: 'Mi perfil' },
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children:[
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Configuración | Spa & Boutique Pandas 11',
      },
      {
        path: 'configuracion/panfletos',
        loadComponent: () => import('./pages/settings/home-flyers-settings.component').then(m => m.HomeFlyersSettingsComponent),
        data: { permission: 'home_flyers.manage' },
        title: 'Panfletos semanales | Pandas 11',
      },
      {
        path: 'panel',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Spa & Boutique Pandas 11',
      },
      {
        path:'clientes',
        data: { permission: 'clients.read' },
        component:ClientesTableComponent,
        title:'Angular Clientes Table | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'mascotas',
        data: { permission: 'pets.read' },
        component:MascotasTableComponent,
        title:'Mascotas | Spa & Boutique Pandas 11'
      },
      {
        path:'servicios',
        data: { permission: 'services.read' },
        component:ServiciosComponent,
        title:'Servicios | Spa & Boutique Pandas 11'
      },
      {
        path:'tarifas',
        data: { permission: 'service_prices.read' },
        component:TarifasComponent,
        title:'Tarifas | Spa & Boutique Pandas 11'
      },
      {
        path:'empleados',
        data: { permission: 'employees.read' },
        component:EmpleadosComponent,
        title:'Empleados | Spa & Boutique Pandas 11'
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
      },
      { path: 'ventas', loadComponent: () => import('./pages/ventas/ventas.component').then(m => m.VentasComponent), canActivate: [salesGuard], data: { permission: 'sales.read' }, title: 'Ventas | Pandas 11' },
      { path: 'productos', loadComponent: () => import('./pages/productos/productos.component').then(m => m.ProductosComponent), canActivate: [salesGuard], data: { permission: 'products.read' }, title: 'Productos | Pandas 11' },
      { path: 'pagos', loadComponent: () => import('./pages/pagos/pagos.component').then(m => m.PagosComponent), data: { permission: 'payments.read' }, title: 'Pagos y saldos | Spa Boutique Pandas 11' },
      { path: 'caja', loadComponent: () => import('./pages/caja/caja.component').then(m => m.CajaComponent), canActivate: [salesGuard], data: { permission: 'cash.read' }, title: 'Caja | Pandas 11' },
      {
        path:'calendario',
        data: { permission: 'appointments.read' },
        component:CalendarioComponent,
        title:'Agenda | Spa & Boutique Pandas 11'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Iniciar sesión | Spa Boutique Pandas 11'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Crear cuenta | Spa Boutique Pandas 11'
  },
  {
    path:'confirm-email',
    component:ConfirmEmailComponent,
    title:'Confirma tu correo | Spa & Boutique Pandas 11'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
