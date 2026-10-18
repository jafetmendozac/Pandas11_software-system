import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from './authorization.service';
import { SupabaseService } from './supabase.service';

describe('AuthorizationService', () => {
  let event: (name: string, session?: { user: { id: string } }) => void;
  let profile: { data: { active: boolean } | null; error: unknown };
  let rpc: jasmine.Spy;
  let service: AuthorizationService;
  beforeEach(() => {
    profile = { data: { active: true }, error: null };
    rpc = jasmine.createSpy().and.resolveTo({ data: ['panel.access'], error: null });
    const client = {
      auth: {
        onAuthStateChange: (callback: (name: string, session?: { user: { id: string } }) => void) => { event = callback; },
        getUser: async () => ({ data: { user: { id: 'test-user', email_confirmed_at: '2026-10-17' } }, error: null }),
      },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => profile }) }) }),
      rpc,
    };
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: { client } }] });
    service = TestBed.inject(AuthorizationService);
  });
  it('carga permisos desde el servidor', async () => {
    expect(await service.refresh()).toBeTrue();
    expect(service.has('panel.access')).toBeTrue();
  });
  it('deniega perfil inactivo', async () => {
    profile.data = { active: false };
    expect(await service.refresh()).toBeFalse();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('descarta permisos anteriores si falla el servidor', async () => {
    await service.refresh();
    rpc.and.resolveTo({ data: null, error: { message: 'fallo' } });
    expect(await service.refresh()).toBeFalse();
    expect(service.permissions()).toEqual([]);
  });
  it('descarta una respuesta que llega después del cierre de sesión', async () => {
    let resolve!: (value: { data: string[]; error: null }) => void;
    rpc.and.callFake(() => new Promise(r => { resolve = r; }));
    const pending = service.refresh();
    await new Promise(r => setTimeout(r, 0));
    event('SIGNED_OUT');
    resolve({ data: ['panel.access'], error: null });
    expect(await pending).toBeFalse();
    expect(service.permissions()).toEqual([]);
  });
  it('mantiene montado Roles mientras comprueba permisos de nuevo', async () => {
    await service.refresh();
    let resolve!: (value: { data: string[]; error: null }) => void;
    rpc.and.callFake(() => new Promise(r => { resolve = r; }));
    const pending = service.refresh();
    expect(service.has('panel.access')).toBeTrue();
    await new Promise(r => setTimeout(r, 0));
    expect(service.has('panel.access')).toBeTrue();
    resolve({ data: ['panel.access', 'security.read'], error: null });
    expect(await pending).toBeTrue();
    expect(service.has('security.read')).toBeTrue();
  });
  it('comparte la comprobación entre consumidores simultáneos', async () => {
    const first = service.refresh();
    const second = service.refresh();
    expect(first).toBe(second);
    expect(await first).toBeTrue();
    expect(await second).toBeTrue();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('renovar el token de la misma cuenta no vacía el menú', async () => {
    await service.refresh();
    event('TOKEN_REFRESHED', { user: { id: 'test-user' } });
    expect(service.has('panel.access')).toBeTrue();
    await new Promise(r => setTimeout(r, 0));
    expect(await service.refresh()).toBeTrue();
  });
  it('cambiar de cuenta elimina de inmediato los permisos anteriores', async () => {
    await service.refresh();
    event('SIGNED_OUT');
    expect(service.permissions()).toEqual([]);
  });

});
