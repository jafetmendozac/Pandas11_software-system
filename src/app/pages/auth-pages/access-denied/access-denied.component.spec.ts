import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccessDeniedComponent } from './access-denied.component';
import { AuthorizationService } from '../../../shared/services/authorization.service';
import { SupabaseService } from '../../../shared/services/supabase.service';

describe('AccessDeniedComponent', () => {
  let fixture: ComponentFixture<AccessDeniedComponent>;
  let authorization: { refresh: jasmine.Spy };
  let supabase: { signOut: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    authorization = { refresh: jasmine.createSpy().and.resolveTo(true) };
    supabase = { signOut: jasmine.createSpy().and.resolveTo() };
    await TestBed.configureTestingModule({
      imports: [AccessDeniedComponent],
      providers: [
        provideRouter([]),
        { provide: AuthorizationService, useValue: authorization },
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(AccessDeniedComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('ofrece inicio y perfil solo cuando la cuenta activa puede abrirlo', async () => {
    await render();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('No puedes abrir esta página');
    expect(page.querySelector('a[href="/mi-perfil"]')).not.toBeNull();
    expect(page.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('no envía a un perfil inactivo y permite cambiar de cuenta', async () => {
    authorization.refresh.and.resolveTo(false);
    await render();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('a[href="/mi-perfil"]')).toBeNull();
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    await fixture.componentInstance.signOut();

    expect(supabase.signOut).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/signin');
  });

  it('mantiene la página y explica un fallo al cerrar sesión', async () => {
    await render();
    supabase.signOut.and.rejectWith(new Error('Fallo de red'));
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    await fixture.componentInstance.signOut();
    fixture.detectChanges();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('No se pudo cerrar la sesión');
  });
});
