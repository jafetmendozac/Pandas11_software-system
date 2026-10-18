import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { InicioComponent } from './inicio.component';

describe('Inicio público y separación del panel', () => {
  let authorization: { refresh: jasmine.Spy; has: jasmine.Spy };
  let createSupabase: jasmine.Spy;

  beforeEach(() => {
    authorization = { refresh: jasmine.createSpy().and.resolveTo(false), has: jasmine.createSpy().and.returnValue(false) };
    createSupabase = jasmine.createSpy('Supabase factory').and.returnValue({ signOut: async () => {} });
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes),
      { provide: AuthorizationService, useValue: authorization },
      { provide: SupabaseService, useFactory: createSupabase },
    ] });
  });

  it('abre la raíz anónima sin consultar autorización ni construir Supabase o el shell privado', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(InicioComponent);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(authorization.refresh).not.toHaveBeenCalled();
    expect(createSupabase).not.toHaveBeenCalled();
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
