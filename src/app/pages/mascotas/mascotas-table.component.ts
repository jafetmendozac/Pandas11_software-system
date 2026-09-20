import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { MascotasService, PetRecord } from '../../shared/services/mascotas.service';
import { SupabaseService } from '../../shared/services/supabase.service';

interface ClientOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-mascotas-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ComponentCardComponent, PageBreadcrumbComponent],
  templateUrl: './mascotas-table.component.html',
})
export class MascotasTableComponent implements OnInit {
  pets: PetRecord[] = [];
  clients: ClientOption[] = [];
  form: PetRecord = this.emptyPet();
  editingId: string | undefined;
  isFormOpen = false;

  constructor(
    private readonly mascotasService: MascotasService,
    private readonly supabase: SupabaseService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    const [pets, clients] = await Promise.all([
      this.mascotasService.getRecords(),
      this.supabase.client.from('clients').select('id, first_name, last_name').order('first_name'),
    ]);
    if (clients.error) throw clients.error;
    this.pets = pets;
    this.clients = (clients.data ?? []).map((client) => ({
      id: client.id,
      name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim(),
    }));
  }

  openCreate(): void {
    this.form = this.emptyPet();
    this.editingId = undefined;
    this.isFormOpen = true;
  }

  openEdit(pet: PetRecord): void {
    this.form = { ...pet };
    this.editingId = pet.id;
    this.isFormOpen = true;
  }

  async save(): Promise<void> {
    if (!this.form.client_id || !this.form.name.trim()) return;
    const row = {
      client_id: this.form.client_id,
      action: this.form.name,
      category: this.form.breed,
      type: this.form.pet_size,
      amount: this.form.weight,
      account: this.form.allergies,
      method: this.form.pet_sex,
      coat_type: this.form.pet_coat_type,
      bites: this.form.bites,
      notes: this.form.notes,
      status: this.form.active ? 'Active' : 'Inactive',
      birth_date: this.form.birth_date,
      death_date: this.form.death_date,
      id: this.editingId,
    };
    if (this.editingId) await this.mascotasService.update(row);
    else await this.mascotasService.create(row);
    await this.load();
    this.isFormOpen = false;
  }

  async remove(pet: PetRecord): Promise<void> {
    if (!pet.id || !window.confirm(`¿Eliminar a ${pet.name}?`)) return;
    await this.mascotasService.remove({ id: pet.id });
    await this.load();
  }

  clientName(id: string): string {
    return this.clients.find((client) => client.id === id)?.name ?? 'Sin cliente';
  }

  private emptyPet(): PetRecord {
    return { client_id: '', name: '', bites: false, active: true };
  }
}
