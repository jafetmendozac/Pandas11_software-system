import { TestBed } from '@angular/core/testing';
import { PersonalizedTable } from './personalized-table.component';

describe('PersonalizedTable: imágenes', () => {
  it('renderiza la foto en la tabla de escritorio y en la tarjeta móvil', () => {
    const fixture = TestBed.createComponent(PersonalizedTable);
    fixture.componentInstance.allowCreate = false;
    fixture.componentInstance.columns = [
      { key: 'photo_signed_url', label: 'Foto', display: 'image', hideHeader: true },
      { key: 'name', label: 'Nombre' },
    ];
    fixture.componentInstance.tableData = [{ name: 'Luna', photo_signed_url: 'https://signed.example/luna.jpg' }];
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const desktopImage = root.querySelector<HTMLImageElement>('table img[alt="Foto de Luna"]');
    const mobileImage = root.querySelector<HTMLImageElement>('article img[alt="Foto de Luna"]');
    expect(desktopImage?.src).toBe('https://signed.example/luna.jpg');
    expect(desktopImage?.classList.contains('block')).toBeTrue();
    expect(mobileImage?.src).toBe('https://signed.example/luna.jpg');
  });
});
