import { ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthorizationService } from '../../../services/authorization.service';
import { RecordsService, InternalNote, Vaccination } from '../../../services/records.service';
import { Client } from '../../../services/clientes.service';
import { Pet } from '../../../services/mascotas.service';
import { PersonalizedTable, TableColumn, TableRow } from '../../tables/basic-tables/personalize-table/personalized-table.component';
@Component({
    selector: 'app-record-details', standalone: true, imports: [FormsModule, PersonalizedTable],
    template: `
  <section class="my-5 space-y-4 rounded-xl border border-gray-200 bg-white p-5 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
    <h3 class="text-lg font-semibold">Ficha de {{ pet?.name || client?.first_name }}</h3>
    @if (archived) { <p>Archivo: consulta de antecedentes, sin edición.</p> }
    @if (error) { <p role="alert" class="text-error-600 dark:text-error-400">{{ error }}</p> }
    @if (loading) { <p role="status">Cargando antecedentes…</p> } @else {
      @if (pet) {
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <dt>Raza</dt><dd>{{ pet.breed || 'No indicada' }}</dd>
          <dt>Tamaño</dt><dd>{{ pet.pet_size || 'No indicado' }}</dd>
          <dt>Peso (kg)</dt><dd>{{ pet.weight_kg ?? 'No indicado' }}</dd>
          <dt>Alergias</dt><dd>{{ pet.allergies ? 'Sí' : 'No' }}</dd>
          <dt>Muerde</dt><dd>{{ pet.bites ? 'Sí' : 'No' }}</dd>
          <dt>Nacimiento</dt><dd>{{ pet.birth_date || 'No indicado' }}</dd>
          <dt>Fallecimiento</dt><dd>{{ pet.death_date || 'No indicado' }}</dd>
        </dl>
        <h4 class="font-medium">Observaciones visibles al cliente</h4><p class="whitespace-pre-wrap">{{ pet.client_notes || 'Sin observaciones.' }}</p>
        <h4 class="font-medium">Vacunas</h4>
        <app-personalized-table [tableData]="vaccines" [columns]="vaccineColumns"
          [allowCreate]="!archived && authorization.has('vaccinations.manage')"
          [allowEdit]="!archived && authorization.has('vaccinations.manage')" [allowDelete]="false"
          [saveAction]="saveVaccine" addLabel="Registrar vacuna" createTitle="Registrar vacuna" editTitle="Corregir vacuna" />
      }
      @if (authorization.has('internal.read')) {
        <h4 class="font-medium">Notas internas · solo personal autorizado</h4>
        <p class="text-sm">Incluye aquí detalles de alergias y antecedentes internos. Esta nota no es visible para el cliente.</p>
        <label class="block">Observaciones internas
          <textarea [(ngModel)]="notes" [readOnly]="archived || saving || !authorization.has('internal.manage')"
            class="mt-2 min-h-28 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"></textarea>
        </label>
        @if (note) { <p class="text-sm">Última edición: {{ note.updated_at }} · Autor: {{ note.updated_by }}</p> }
        @if (!archived && authorization.has('internal.manage')) {
          <button type="button" (click)="saveNotes()" [disabled]="saving" class="rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-50">Guardar nota interna</button>
        }
        @if (notice) { <p role="status">{{ notice }}</p> }
      }
    }
  </section>`,
})
export class RecordDetailsComponent implements OnChanges {
    @Input()
    client: Client | null = null;
    @Input()
    pet: Pet | null = null;
    @Input()
    archived = false;
    readonly authorization = inject(AuthorizationService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly service = inject(RecordsService);
    private revision = 0;
    loading = false;
    saving = false;
    error = '';
    notice = '';
    notes = '';
    note: InternalNote | null = null;
    vaccines: Vaccination[] = [];
    vaccineColumns: TableColumn[] = [
        { key: 'vaccine', label: 'Vacuna' }, { key: 'applied_on', label: 'Aplicada el', type: 'date' },
        { key: 'valid_until', label: 'Válida hasta', type: 'date', required: false },
    ];
    ngOnChanges(): void { void this.load(); }
    private async load(): Promise<void> {
        const revision = ++this.revision;
        const id = this.pet?.id ?? this.client?.id;
        this.loading = true;
        this.error = '';
        this.notice = '';
        this.notes = '';
        this.note = null;
        this.vaccines = [];
        if (!id) {
            this.loading = false;
            return;
        }
        try {
            const [vaccines, note] = await Promise.all([
                this.pet ? this.service.vaccinations(id) : Promise.resolve([]),
                this.authorization.has('internal.read') ? this.service.note(this.pet ? 'pet' : 'client', id) : Promise.resolve(null),
            ]);
            if (revision !== this.revision)
                return;
            this.vaccines = vaccines;
            this.note = note;
            this.notes = note?.notes ?? '';
        }
        catch (error) {
            if (revision === this.revision)
                this.error = error instanceof Error ? error.message : 'No se pudieron cargar antecedentes.';
        }
        finally {
            if (revision === this.revision)
                this.loading = false;
            this.cdr.markForCheck();
        }
    }
    readonly saveVaccine = async (row: TableRow, mode: 'create' | 'update' | 'delete'): Promise<void> => {
        if (!this.pet || this.archived || !this.authorization.has('vaccinations.manage') || mode === 'delete')
            throw new Error('Operación no permitida.');
        const id = this.pet.id, revision = this.revision;
        await this.service.saveVaccination(id, row, mode === 'update');
        const vaccines = await this.service.vaccinations(id);
        if (revision === this.revision)
            this.vaccines = vaccines;
        this.cdr.markForCheck();
    };
    async saveNotes(): Promise<void> {
        const id = this.pet?.id ?? this.client?.id;
        if (!id || this.saving || this.archived || !this.authorization.has('internal.manage'))
            return;
        const revision = this.revision;
        const kind = this.pet ? 'pet' : 'client';
        this.saving = true;
        this.error = '';
        this.notice = '';
        try {
            await this.service.saveNote(kind, id, this.notes, !!this.note);
            const note = await this.service.note(kind, id);
            if (revision === this.revision) {
                this.note = note;
                this.notice = 'Nota guardada.';
            }
        }
        catch (error) {
            if (revision === this.revision)
                this.error = error instanceof Error ? error.message : 'No se guardó la nota.';
        }
        finally {
            this.saving = false;
            this.cdr.markForCheck();
        }
    }
}
