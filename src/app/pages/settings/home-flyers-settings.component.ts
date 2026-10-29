import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { HomeFlyersService } from '../../shared/services/home-flyers.service';
import { HOME_FLYER_DAYS, HomeFlyer, weekdayInLima } from '../../shared/services/home-flyers.models';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { A11yModule } from '@angular/cdk/a11y';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

interface PendingSave {
  weekday: number;
  path: string | null;
  alt: string | null;
  published: boolean;
  expectedVersion: number;
  file: File | null;
  uploaded: boolean;
}

@Component({
  selector: 'app-home-flyers-settings', standalone: true,
  imports: [FormsModule, RouterLink, PageBreadcrumbComponent, ComponentCardComponent, A11yModule, ModalComponent],
  templateUrl: './home-flyers-settings.component.html',
})
export class HomeFlyersSettingsComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('chooseFileButton') private chooseFileButton?: ElementRef<HTMLButtonElement>;
  private readonly api = inject(HomeFlyersService);
  readonly auth = inject(AuthorizationService);
  readonly days = HOME_FLYER_DAYS;
  readonly rows = signal<HomeFlyer[]>([]);
  readonly selectedDay = signal(weekdayInLima(new Date()));
  readonly selected = computed(() => this.rows().find(row => row.weekday === this.selectedDay()) ?? null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly previewOpen = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  alt = '';
  published = false;
  file: File | null = null;
  pending: PendingSave | null = null;
  private objectUrl: string | null = null;
  private previewRevision = 0;
  private previewReturnFocus: HTMLElement | null = null;

  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { this.previewRevision++; this.revokeObjectUrl(); }

  private message(error: unknown): string {
    return (error as { message?: string })?.message || 'No se pudo completar la operación.';
  }

  async load(): Promise<void> {
    if (!this.auth.has('home_flyers.manage')) {
      this.loading.set(false);
      this.error.set('No tienes permiso para administrar panfletos.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      this.rows.set(await this.api.list());
      this.resetForm();
      await this.loadPreview();
    } catch (error) { this.error.set(this.message(error)); }
    finally { this.loading.set(false); }
  }

  selectDay(weekday: number): void {
    if (this.busy() || this.pending || this.selectedDay() === weekday) return;
    this.selectedDay.set(weekday);
    this.error.set(''); this.notice.set('');
    this.resetForm();
    void this.loadPreview();
  }

  chooseFile(event: Event): void {
    if (this.pending || this.busy()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    try {
      this.api.preparePath(this.selectedDay(), file);
      this.revokeObjectUrl();
      this.file = file;
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl.set(this.objectUrl);
      this.previewReturnFocus = this.chooseFileButton?.nativeElement ?? null;
      this.previewOpen.set(true);
      this.error.set(''); this.notice.set('');
    } catch (error) {
      input.value = '';
      this.error.set(this.message(error));
    }
  }

  discardFile(): void {
    if (this.busy() || this.pending) return;
    this.file = null;
    this.clearFileInput();
    this.revokeObjectUrl();
    this.previewOpen.set(false);
    void this.loadPreview();
  }

  openPreview(): void {
    if (!this.previewUrl()) return;
    this.previewReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
    const returnFocus = this.previewReturnFocus;
    this.previewReturnFocus = null;
    queueMicrotask(() => returnFocus?.focus());
  }

  async save(): Promise<void> {
    const row = this.selected();
    if (!row || this.busy() || !this.auth.has('home_flyers.manage')) return;
    if (!this.pending) {
      const alt = this.alt.trim();
      if ((this.file || row.object_path) && (alt.length < 5 || alt.length > 200)) {
        this.error.set('Describe la imagen en 5 a 200 caracteres para quienes no puedan verla.');
        return;
      }
      if (this.published && !this.file && !row.object_path) {
        this.error.set('Carga una imagen antes de publicarla.');
        return;
      }
      try {
        this.pending = {
          weekday: row.weekday,
          path: this.file ? this.api.preparePath(row.weekday, this.file) : row.object_path,
          alt: this.file || row.object_path ? alt : null,
          published: this.published,
          expectedVersion: row.version,
          file: this.file,
          uploaded: !this.file,
        };
      } catch (error) { this.error.set(this.message(error)); return; }
    }
    const pending = this.pending;
    this.busy.set(true);
    this.error.set(''); this.notice.set('');
    try {
      if (pending.file && pending.path && !pending.uploaded) {
        try { await this.api.upload(pending.path, pending.file); pending.uploaded = true; }
        catch (error) {
          if (await this.api.exists(pending.path)) pending.uploaded = true;
          else {
            this.pending = null;
            this.error.set(`No se pudo subir la imagen. Revisa el archivo o la conexión y vuelve a guardar. ${this.message(error)}`);
            return;
          }
        }
      }
      const saved = await this.api.save({
        weekday: pending.weekday, path: pending.path, alt: pending.alt,
        published: pending.published, expectedVersion: pending.expectedVersion,
      });
      await this.finish(saved);
    } catch (error) {
      await this.resolveFailure(pending, error);
    } finally { this.busy.set(false); }
  }

  private async resolveFailure(pending: PendingSave, error: unknown): Promise<void> {
    let latest: HomeFlyer | undefined;
    try { latest = (await this.api.list()).find(row => row.weekday === pending.weekday); }
    catch { /* La respuesta puede ser incierta; conservar el mismo intento. */ }
    if (latest && latest.version > pending.expectedVersion &&
      latest.object_path === pending.path && latest.alt_text === pending.alt &&
      latest.published === pending.published) {
      await this.finish(latest);
      return;
    }
    const code = (error as { code?: string })?.code;
    if (latest && code && /^(22|23|40|42)/.test(code)) {
      if (pending.file && pending.path && pending.uploaded && latest.object_path !== pending.path) {
        try { await this.api.removeOrphan(pending.path); }
        catch { /* Dejar la limpieza para revisión; la pieza publicada sigue intacta. */ }
      }
      this.pending = null;
      this.rows.update(rows => rows.map(row => row.weekday === latest!.weekday ? latest! : row));
      this.error.set(code === '40001'
        ? 'Otro usuario cambió este día. Tu texto e imagen siguen aquí; revisa la vista y vuelve a guardar.'
        : this.message(error));
      return;
    }
    this.error.set('No se pudo confirmar el resultado. Reintenta el mismo cambio; no selecciones otra imagen todavía.');
  }

  private async finish(saved: HomeFlyer): Promise<void> {
    this.rows.update(rows => rows.map(row => row.weekday === saved.weekday ? saved : row));
    this.pending = null;
    this.file = null;
    this.clearFileInput();
    this.revokeObjectUrl();
    this.previewOpen.set(false);
    this.alt = saved.alt_text ?? '';
    this.published = saved.published;
    await this.loadPreview();
    this.notice.set(saved.published
      ? `${this.days[saved.weekday - 1]}: panfleto publicado. Se mostrará ese día en la portada.`
      : `${this.days[saved.weekday - 1]}: panfleto guardado sin publicar.`);
  }

  private resetForm(): void {
    this.previewOpen.set(false);
    this.file = null;
    this.clearFileInput();
    this.revokeObjectUrl();
    const row = this.selected();
    this.alt = row?.alt_text ?? '';
    this.published = row?.published ?? false;
  }

  private async loadPreview(): Promise<void> {
    const revision = ++this.previewRevision;
    const path = this.selected()?.object_path;
    if (!path) { this.previewUrl.set(null); return; }
    try {
      const url = await this.api.signedUrl(path);
      if (revision === this.previewRevision && !this.file) this.previewUrl.set(url);
    } catch {
      if (revision === this.previewRevision) this.previewUrl.set(null);
      this.error.set('No se pudo cargar la vista previa. La configuración guardada no cambió.');
    }
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }

  private clearFileInput(): void {
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }
}
