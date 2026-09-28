import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-confirm-email',
  imports: [AuthPageLayoutComponent, RouterModule],
  templateUrl: './confirm-email.component.html',
  styles: ``
})
export class ConfirmEmailComponent implements OnInit {
  email = '';

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }
}
