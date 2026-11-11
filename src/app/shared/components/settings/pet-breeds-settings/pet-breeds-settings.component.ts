import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { AuthorizationService } from '../../../services/authorization.service';
import { PetBreed, PetBreedsService } from '../../../services/pet-breeds.service';

@Component({
  selector: 'app-pet-breeds-settings',
  standalone: true,
  imports: [FormsModule, A11yModule, ComponentCardComponent, ModalComponent],
  templateUrl: './pet-breeds-settings.component.html',
})
export class PetBreedsSettingsComponent {
  readonly authorization = inject(AuthorizationService);
  private readonly breeds = inject(PetBreedsService);
  readonly breedsList = signal<PetBreed[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly notice = signal('');
  readonly failed = signal(false);
  readonly confirmingBreedId = signal<string | null>(null);
  readonly confirmingBreedName = signal('');
  showBreedForm = false;
  editingId = '';
  breed: { name: string; active: boolean } = { name: '', active: true };
  search = '';

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.notice.set('');
    this.failed.set(false);
    try {
      if (!this.authorization.has('service_prices.read')) throw new Error('Sin permiso para consultar razas.');
      const result = await this.breeds.search({ search: '', page: 1, size: 100 });
      this.breedsList.set(result.rows);
    } catch (error) {
      this.failed.set(true);
      this.notice.set(error instanceof Error ? error.message : 'No se pudieron cargar las razas.');
    } finally {
      this.loading.set(false);
    }
  }

  filteredBreeds(): PetBreed[] {
    const query = this.search.trim().toLowerCase();
    return this.breedsList().filter(item => item.name.toLowerCase().includes(query));
  }

  createBreed(): void {
    this.editingId = '';
    this.breed = { name: '', active: true };
    this.showBreedForm = true;
    this.notice.set('');
    this.failed.set(false);
  }

  edit(breed: PetBreed): void {
    this.editingId = breed.id;
    this.breed = { name: breed.name, active: breed.active };
    this.showBreedForm = true;
    this.notice.set('');
    this.failed.set(false);
  }

  closeBreedForm(): void {
    this.showBreedForm = false;
    this.editingId = '';
    this.breed = { name: '', active: true };
  }

  async confirmDelete(breed: PetBreed): Promise<void> {
    this.confirmingBreedId.set(breed.id);
    this.confirmingBreedName.set(breed.name);
  }

  async executeDelete(): Promise<void> {
    const id = this.confirmingBreedId();
    if (!id) return;
    const breed = this.breedsList().find(item => item.id === id);
    if (!breed) { this.cancelDelete(); return; }
    await this.deleteBreed(breed);
    this.cancelDelete();
  }

  cancelDelete(): void {
    this.confirmingBreedId.set(null);
    this.confirmingBreedName.set('');
  }

  async deleteBreed(breed: PetBreed): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.breeds.remove({ id: breed.id } as PetBreed);
      this.breedsList.update(items => items.filter(item => item.id !== breed.id));
      this.notice.set('Raza eliminada.');
    } catch (error) {
      this.failed.set(true);
      this.notice.set(error instanceof Error ? error.message : 'No se pudo completar la solicitud.');
    } finally {
      this.busy.set(false);
    }
  }

  private formatName(value: string): string {
    return value.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  async saveBreed(): Promise<void> {
    if (this.busy()) return;
    const name = this.formatName(this.breed.name);
    if (!name) return this.showError('El nombre de la raza es obligatorio.');
    this.breed.name = name;
    this.busy.set(true);
    try {
      const payload = { id: this.editingId || '', name, active: this.breed.active } as PetBreed;
      if (this.editingId) {
        await this.breeds.update(payload);
        this.notice.set('Raza actualizada.');
      } else {
        await this.breeds.create({ name, active: this.breed.active } as PetBreed);
        this.notice.set('Raza creada.');
      }
      this.closeBreedForm();
      try { await this.load(); } catch { /* no bloquea el cierre del formulario */ }
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  private showError(error: unknown): void {
    this.failed.set(true);
    const details = error as { code?: string; message?: string };
    if (details?.code === '23505') {
      this.notice.set('Ya existe una raza con ese nombre. Elige un valor diferente.');
    } else {
      this.notice.set(details?.message || 'No se pudo completar la solicitud. Inténtalo de nuevo.');
    }
  }
}
