import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ComponentCardComponent } from '../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RecordDetailsComponent } from '../../shared/components/records/record-details/record-details.component';
import { MascotasService, Pet } from '../../shared/services/mascotas.service';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { PetPhotosService } from '../../shared/services/pet-photos.service';

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
  private readonly photos = inject(PetPhotosService);
  readonly authorization = inject(AuthorizationService);

  pet: Pet | null = null;
  loading = true;
  error = '';
  photoSaving = false;
  photoError = '';
  photoNotice = '';
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

  async selectPhoto(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.pet || this.archived || !this.authorization.has('pets.manage') || this.photoSaving) return;
    this.photoSaving = true;
    this.photoError = '';
    this.photoNotice = '';
    try {
      this.pet.photo_url = await this.photos.replace(this.pet.id, this.pet.photo_url, file);
      this.pet.photo_signed_url = await this.photos.signedUrl(this.pet.photo_url);
      this.photoNotice = 'Foto guardada.';
    } catch (error) {
      this.photoError = error instanceof Error ? error.message : 'No se pudo guardar la foto.';
    } finally {
      this.photoSaving = false;
      this.cdr.markForCheck();
    }
  }

  async removePhoto(): Promise<void> {
    if (!this.pet?.photo_url || this.archived || !this.authorization.has('pets.manage') || this.photoSaving) return;
    this.photoSaving = true;
    this.photoError = '';
    this.photoNotice = '';
    try {
      await this.photos.remove(this.pet.id, this.pet.photo_url);
      this.pet.photo_url = null;
      this.pet.photo_signed_url = null;
      this.photoNotice = 'Foto retirada.';
    } catch (error) {
      this.photoError = error instanceof Error ? error.message : 'No se pudo retirar la foto.';
    } finally {
      this.photoSaving = false;
      this.cdr.markForCheck();
    }
  }
}
