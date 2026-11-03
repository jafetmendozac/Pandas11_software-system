import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterModule } from '@angular/router';
import { routes } from '../../../app.routes';
import { profileGuard } from '../../guards/auth.guard';
import { SidebarService } from '../../services/sidebar.service';
import { ClientLayoutComponent } from './client-layout.component';

@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class SidebarStub { @Input() mode = ''; }
@Component({ selector: 'app-header', standalone: true, template: '' })
class HeaderStub {
  @Input() homePath = '';
  @Input() profileLink = '';
}
@Component({ selector: 'app-backdrop', standalone: true, template: '' })
class BackdropStub {}

describe('Marco del portal cliente', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClientLayoutComponent],
      providers: [provideRouter([]), SidebarService],
    });
    TestBed.overrideComponent(ClientLayoutComponent, {
      set: { imports: [CommonModule, RouterModule, SidebarStub, HeaderStub, BackdropStub] },
    });
  });

  it('agrupa las rutas de cliente y reutiliza el sidebar y encabezado del panel', () => {
    const clientRoute = routes.find(route => route.component === ClientLayoutComponent);
    expect(clientRoute?.canActivateChild).toContain(profileGuard);
    expect(clientRoute?.children?.map(route => route.path)).toEqual(['mi-perfil', 'mis-datos', 'catalogo']);

    const fixture = TestBed.createComponent(ClientLayoutComponent);
    fixture.detectChanges();
    const sidebar = fixture.debugElement.query(By.directive(SidebarStub)).componentInstance as SidebarStub;
    const header = fixture.debugElement.query(By.directive(HeaderStub)).componentInstance as HeaderStub;
    expect(sidebar.mode).toBe('client');
    expect(header.homePath).toBe('/mi-perfil');
    expect(header.profileLink).toBe('/mi-perfil');
    expect(fixture.nativeElement.querySelector('app-backdrop')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.max-w-5xl')).not.toBeNull();
  });

  it('usa el mismo desplazamiento del panel cuando se contrae el menú', () => {
    const fixture = TestBed.createComponent(ClientLayoutComponent);
    fixture.detectChanges();
    const shell = (fixture.nativeElement as HTMLElement).querySelector('app-header')!.parentElement!;
    expect(shell.classList.contains('xl:ms-[290px]')).toBeTrue();
    TestBed.inject(SidebarService).setExpanded(false);
    fixture.detectChanges();
    expect(shell.classList.contains('xl:ms-[90px]')).toBeTrue();
  });
});
