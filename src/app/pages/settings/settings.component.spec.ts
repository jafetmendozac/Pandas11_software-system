import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsComponent } from './settings.component';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('Apariencia de configuración', () => {
  let previousTheme: string | null;
  let wasDark: boolean;

  beforeEach(() => {
    previousTheme = localStorage.getItem('theme');
    wasDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', 'light');
    TestBed.configureTestingModule({ providers: [
      { provide: AuthorizationService, useValue: { has: () => false } },
    ] });
  });

  afterEach(() => {
    if (previousTheme === null) localStorage.removeItem('theme');
    else localStorage.setItem('theme', previousTheme);
    document.documentElement.classList.toggle('dark', wasDark);
  });

  it('previsualiza oscuro sin guardarlo y descartar restaura claro', () => {
    const settings = TestBed.runInInjectionContext(() => new SettingsComponent());
    settings.openAppearance();
    settings.theme = 'dark';
    settings.previewTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('light');

    settings.cancel();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
    expect(settings.theme).toBe('light');
  });

  it('guardar persiste el tema y otro servicio puede restaurarlo', () => {
    const settings = TestBed.runInInjectionContext(() => new SettingsComponent());
    settings.openAppearance();
    settings.theme = 'dark';
    settings.previewTheme('dark');
    settings.save();
    expect(localStorage.getItem('theme')).toBe('dark');
    document.documentElement.classList.remove('dark');

    new ThemeService();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });
});

describe('Secciones de configuración por vista de trabajo', () => {
  it('oculta panfletos y acceso del equipo al elegir Cliente o Personal', () => {
    const selectedPermissions = signal<string[]>([]);
    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthorizationService, useValue: {
          has: () => true,
          hasInSelectedRole: (permission: string) => selectedPermissions().includes(permission),
        } },
      ],
    });
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const text = () => fixture.nativeElement.textContent as string;
    expect(text()).not.toContain('Panfletos de cada día');
    expect(text()).not.toContain('Acceso del equipo');
    expect(text()).toContain('Apariencia');
    expect(text()).toContain('Administra tus preferencias y datos personales.');

    selectedPermissions.set(['panel.access']);
    fixture.detectChanges();
    expect(text()).not.toContain('Panfletos de cada día');
    expect(text()).not.toContain('Acceso del equipo');

    selectedPermissions.set(['panel.access', 'home_flyers.manage', 'security.read', 'roles.manage']);
    fixture.detectChanges();
    expect(text()).toContain('Panfletos de cada día');
    expect(text()).toContain('Acceso del equipo');
  });
});
