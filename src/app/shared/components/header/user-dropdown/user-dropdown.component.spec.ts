import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UserDropdownComponent } from './user-dropdown.component';
import { ProfilesService } from '../../../services/profiles.service';
import { SupabaseService } from '../../../services/supabase.service';

describe('Nombre de la cuenta en el encabezado', () => {
  it('muestra los nombres al terminar la consulta fuera de Angular', async () => {
    const getCurrent = jasmine.createSpy().and.resolveTo({
      email: 'ana@example.test',
      profile: { first_name: 'Ana', last_name: 'Valdez' },
      metadata: {},
    });
    TestBed.configureTestingModule({
      imports: [UserDropdownComponent],
      providers: [
        { provide: ProfilesService, useValue: { getCurrent } },
        { provide: SupabaseService, useValue: {} },
        { provide: Router, useValue: {} },
      ],
    });

    const fixture = TestBed.createComponent(UserDropdownComponent);
    fixture.ngZone?.runOutsideAngular(() => fixture.detectChanges());
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(getCurrent).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('button.dropdown-toggle')?.textContent).toContain('Ana Valdez');
    expect(fixture.nativeElement.querySelector('button.dropdown-toggle')?.textContent).not.toContain('Mi cuenta');
  });
});
