import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { ProfilesService } from '../../../services/profiles.service';
import { InputFieldComponent } from '../../form/input/input-field.component';

import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-meta-card',
  imports: [
    ModalComponent,
    InputFieldComponent,
    ButtonComponent,
    FormsModule,
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent implements OnInit {

  constructor(
    public modal: ModalService,
    private readonly profilesService: ProfilesService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  isInfoModalOpen = false;
  isSaving = false;
  errorMessage = '';
  accessMethod = '';

  user = {
    firstName: '',
    lastName: '',
    email: '',
    active: true,
    avatar: '/images/user/owner.png',
  };

  get fullName(): string {
    const name = `${this.user.firstName} ${this.user.lastName}`.trim();
    return name || this.user.email || 'Sin nombre';
  }

  async ngOnInit() {
    try {
      const account = await this.profilesService.getCurrent();
      this.user.email = account.email;
      this.user.firstName = account.profile?.first_name ?? account.metadata.first_name ?? '';
      this.user.lastName = account.profile?.last_name ?? account.metadata.last_name ?? '';
      this.user.active = account.profile?.active ?? true;
      this.accessMethod = account.providerLabel;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('No se pudo cargar el perfil.', error);
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo cargar el perfil.';
    }
  }

  openInfoModal() {
    this.errorMessage = '';
    this.isInfoModalOpen = true;
  }

  closeInfoModal() {
    this.isInfoModalOpen = false;
    this.errorMessage = '';
  }

  async handleInfoSave() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.errorMessage = '';
    try {
      await this.profilesService.update({
        first_name: this.user.firstName.trim(),
        last_name: this.user.lastName.trim(),
      });
      this.closeInfoModal();
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('No se pudo guardar el perfil.', error);
      this.errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo guardar el perfil.';
    } finally {
      this.isSaving = false;
      this.changeDetectorRef.detectChanges();
    }
  }
}
