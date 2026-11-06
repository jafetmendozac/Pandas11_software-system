import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RecordDetailsComponent } from '../../shared/components/records/record-details/record-details.component';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [RouterLink, ComponentCardComponent, PageBreadcrumbComponent, RecordDetailsComponent],
  templateUrl: './pet-detail.component.html',
})
export class PetDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pets = inject(MascotasService);
  private readonly cdr = inject(ChangeDetectorRef);

  pet: Pet | null = null;
  loading = true;
  error = '';
  readonly archived = this.route.snapshot.queryParamMap.get('archived') === '1';
  private readonly fromClient = this.route.snapshot.queryParamMap.get('fromClient');
  readonly returnPath = this.fromClient ? ['/clientes', this.fromClient] : ['/mascotas'];
  readonly returnLabel = this.fromClient ? 'Volver a la ficha del cliente' : 'Volver a mascotas';
  readonly returnQueryParams = {
    q: this.route.snapshot.queryParamMap.get('q') ?? undefined,
    page: this.route.snapshot.queryParamMap.get('page') ?? undefined,
    archived: this.route.snapshot.queryParamMap.get('archived') ?? undefined,
  };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = 'No encontramos la mascota solicitada.';
      return;
    }
    try {
      this.pet = await this.pets.get(id, this.archived);
      if (!this.pet)
        this.error = 'La mascota no existe o no tienes permiso para verla.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo cargar la ficha de la mascota.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
