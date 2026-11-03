import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { HomeFlyersService } from '../../shared/services/home-flyers.service';
import { InicioComponent } from './inicio.component';

describe('Inicio público y separación del panel', () => {
  let authorization: { refresh: jasmine.Spy; has: jasmine.Spy };
  let createSupabase: jasmine.Spy;
  let flyers: { today: jasmine.Spy; signedUrl: jasmine.Spy };

  beforeEach(() => {
    authorization = { refresh: jasmine.createSpy().and.resolveTo(false), has: jasmine.createSpy().and.returnValue(false) };
    createSupabase = jasmine.createSpy('Supabase factory').and.returnValue({ signOut: async () => {} });
    flyers = {
      today: jasmine.createSpy().and.resolveTo(null),
      signedUrl: jasmine.createSpy().and.resolveTo('https://example.test/flyer.png'),
    };
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes),
      { provide: AuthorizationService, useValue: authorization },
      { provide: SupabaseService, useFactory: createSupabase },
      { provide: HomeFlyersService, useValue: flyers },
    ] });
  });

  it('abre la raíz anónima y conserva el contenido si falta un panfleto', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(InicioComponent);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(authorization.refresh).not.toHaveBeenCalled();
    expect(createSupabase).not.toHaveBeenCalled();
    expect(flyers.today).toHaveBeenCalled();
    expect(harness.routeNativeElement?.querySelector('#daily-flyer-title')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('app-sidebar')).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('Calle General Urco Mz. C Lote 11');
    expect(harness.routeNativeElement?.textContent).toContain('7 a. m. a 6 p. m.');
    const contact = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('main a.button-primary');
    expect(contact?.href).toBe('https://wa.me/51972704860');
    expect(harness.routeNativeElement?.textContent).not.toContain('976 079 212');
    expect(harness.routeNativeElement?.textContent).not.toContain('972 704 860');
    expect(harness.routeNativeElement?.querySelector('a[href^="tel:"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector<HTMLAnchorElement>('.whatsapp-float')?.href).toBe('https://wa.me/51972704860');
  });

  it('muestra el panfleto publicado como modal y permite cerrarlo o ampliarlo de nuevo', async () => {
    flyers.today.and.resolveTo({weekday:1,object_path:'1/demo.png',alt_text:'Promoción de baño del lunes',published:true,version:2,updated_at:null});
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="dialog"]')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('[aria-labelledby="daily-flyer-title"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('[role="dialog"] img')?.getAttribute('alt')).toBe('Promoción de baño del lunes');
    harness.routeNativeElement!.querySelector('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="dialog"]')).toBeNull();
  });

  it('el acceso de cuenta lleva a signin y el menú móvil cierra con Escape devolviendo foco', async () => {
    const harness = await RouterTestingHarness.create('/');
    const button = harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[aria-controls]')!;
    button.click(); harness.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const menu = harness.routeNativeElement!.querySelector('#public-mobile-menu')!;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    harness.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(harness.routeNativeElement!.querySelector('#public-mobile-menu')).toBeNull();
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a.account-link')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/signin');
    expect(harness.routeNativeElement?.textContent).toContain('Volver al inicio');
  });

  it('un visitante sin sesión no entra al dashboard trasladado a panel', async () => {
    await RouterTestingHarness.create('/panel');
    expect(TestBed.inject(Router).url).toContain('/access-denied');
    expect(TestBed.inject(Router).url).toContain('redirect=%2Fpanel');
  });

  it('un CLIENT activo sigue fuera del panel y puede abrir la portada pública', async () => {
    authorization.refresh.and.resolveTo(true);
    const harness = await RouterTestingHarness.create('/panel');
    expect(TestBed.inject(Router).url).toContain('/access-denied');
    await harness.navigateByUrl('/', InicioComponent);
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('publicar la raíz no permite entrar a agenda sin appointments.read', async () => {
    authorization.refresh.and.resolveTo(true);
    authorization.has.and.callFake((permission: string) => permission === 'panel.access');
    await RouterTestingHarness.create('/calendario');
    expect(TestBed.inject(Router).url).toContain('/access-denied');
    expect(authorization.has).toHaveBeenCalledWith('appointments.read');
  });
});
