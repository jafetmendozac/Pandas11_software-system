import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsComponent } from './settings.component';

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
