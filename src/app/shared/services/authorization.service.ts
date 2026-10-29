import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface UserRoleContext {
  role_id: string;
  code: string;
  name: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly supabase = inject(SupabaseService);
  private revision = 0;
  private userId: string | null = null;
  private pending: Promise<boolean> | null = null;
  readonly permissions = signal<readonly string[]>([]);
  readonly roles = signal<readonly UserRoleContext[]>([]);
  readonly selectedRoleId = signal<string | null>(null);
  readonly selectedRole = computed(() => this.roles().find(role => role.role_id === this.selectedRoleId()) ?? null);
  readonly roleOptions = computed(() => this.roles().map(role => ({
    value: role.role_id,
    label: role.code === 'OWNER' ? 'Propietario' : role.name,
  })));

  constructor() {
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      const nextUserId = session?.user.id ?? null;
      if (event === 'SIGNED_OUT' || nextUserId !== this.userId) {
        this.revision++;
        this.pending = null;
        this.userId = nextUserId;
        this.permissions.set([]);
        this.roles.set([]);
        this.selectedRoleId.set(null);
      }
      // Salir del callback Auth antes de consultar Auth de nuevo.
      if (nextUserId) setTimeout(() => { void this.refresh(); }, 0);
    });
  }

  has(permission: string): boolean { return this.permissions().includes(permission); }

  hasInSelectedRole(permission: string): boolean {
    const role = this.selectedRole();
    return role ? role.permissions.includes(permission) : this.has(permission);
  }

  selectRole(roleId: string): void {
    if (this.roles().some(role => role.role_id === roleId)) {
      this.selectedRoleId.set(roleId);
      localStorage.setItem('activeRoleId', roleId);
    }
  }

  refresh(): Promise<boolean> {
    if (this.pending) return this.pending;
    const revision = this.revision;
    const request = this.load(revision).then(result => {
      // La sesión puede restaurarse mientras getUser inicia la primera consulta.
      // Reconsultar la identidad vigente, sin aceptar permisos de la anterior.
      return !result && revision !== this.revision && this.userId !== null
        ? this.load(this.revision) : result;
    });
    this.pending = request;
    void request.finally(() => { if (this.pending === request) this.pending = null; });
    return request;
  }

  private async load(revision: number): Promise<boolean> {
    const deny = (): false => {
      if (revision === this.revision) {
        this.permissions.set([]);
        this.roles.set([]);
        this.selectedRoleId.set(null);
      }
      return false;
    };
    try {
      const { data: auth, error: authError } = await this.supabase.client.auth.getUser();
      if (revision !== this.revision) return false;
      if (authError || !auth.user?.email_confirmed_at) return deny();
      this.userId = auth.user.id;
      const { data: profile, error: profileError } = await this.supabase.client.from('profiles')
        .select('active').eq('id', auth.user.id).maybeSingle();
      if (profileError || !profile?.active) return deny();
      const { data, error } = await this.supabase.client.rpc('my_permissions');
      if (error || !Array.isArray(data) || !data.every(value => typeof value === 'string')) return deny();
      const { data: roleData, error: roleError } = await this.supabase.client.rpc('my_roles');
      if (roleError || !Array.isArray(roleData)) return deny();
      if (revision !== this.revision) return false;
      // Publicar solo el resultado completo: no desmontar Roles durante su actualización.
      this.permissions.set(data);
      const roles = roleData as UserRoleContext[];
      this.roles.set(roles);
      const savedRoleId = localStorage.getItem('activeRoleId');
      const initialRole = roles.find(role => role.role_id === savedRoleId) ?? roles[0];
      this.selectedRoleId.set(initialRole?.role_id ?? null);
      return true;
    } catch { return deny(); }
  }
}
