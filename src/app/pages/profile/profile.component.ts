import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserAddressCardComponent } from '../../shared/components/user-profile/user-address-card/user-address-card.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { Router } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserAddressCardComponent,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent {
  twoFactorEnabled = false;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router,
  ) {}

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    await this.router.navigateByUrl('/signin');
  }
}
