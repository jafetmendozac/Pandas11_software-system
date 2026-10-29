import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthorizationService } from '../../shared/services/authorization.service';
import { HomeFlyersService } from '../../shared/services/home-flyers.service';
import { HomeFlyer } from '../../shared/services/home-flyers.models';
import { HomeFlyersSettingsComponent } from './home-flyers-settings.component';

describe('Editor semanal de panfletos', () => {
  const rows: HomeFlyer[] = Array.from({length:7},(_,index) => ({
    weekday:index+1,object_path:index===0?'1/original.png':null,
    alt_text:index===0?'Panfleto original del lunes':null,
    published:index===0,version:1,updated_at:null,
  }));
  let api: {list:jasmine.Spy;signedUrl:jasmine.Spy;preparePath:jasmine.Spy;upload:jasmine.Spy;exists:jasmine.Spy;save:jasmine.Spy;removeOrphan:jasmine.Spy};
  let auth: {has:jasmine.Spy};

  beforeEach(() => {
    api={
      list:jasmine.createSpy().and.resolveTo(rows.map(row=>({...row}))),
      signedUrl:jasmine.createSpy().and.resolveTo('https://example.test/panfleto.png'),
      preparePath:jasmine.createSpy().and.returnValue('1/00000000-0000-4000-8000-000000000001.png'),
      upload:jasmine.createSpy().and.resolveTo(),
      exists:jasmine.createSpy().and.resolveTo(false),
      save:jasmine.createSpy().and.resolveTo({...rows[0],object_path:'1/00000000-0000-4000-8000-000000000001.png',alt_text:'Nuevo panfleto de baño del lunes',version:2}),
      removeOrphan:jasmine.createSpy().and.resolveTo(),
    };
    auth={has:jasmine.createSpy().and.returnValue(true)};
    TestBed.configureTestingModule({providers:[
      provideRouter([]),
      {provide:HomeFlyersService,useValue:api},
      {provide:AuthorizationService,useValue:auth},
    ]});
  });

  it('conserva las siete posiciones y guarda un reemplazo para el día elegido', async () => {
    const fixture=TestBed.createComponent(HomeFlyersSettingsComponent);
    const component=fixture.componentInstance;
    component.selectedDay.set(1);
    fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    expect(component.rows().length).toBe(7);
    const file=new File([new Uint8Array([1,2,3])],'prueba.png',{type:'image/png'});
    const input=fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement;
    Object.defineProperty(input,'files',{configurable:true,value:[file]});
    input.dispatchEvent(new Event('change'));
    component.alt='Nuevo panfleto de baño del lunes';
    await component.save();fixture.detectChanges();
    expect(api.upload).toHaveBeenCalledWith('1/00000000-0000-4000-8000-000000000001.png',file);
    expect(api.save).toHaveBeenCalledWith(jasmine.objectContaining({weekday:1,published:true,expectedVersion:1}));
    expect(component.selected()?.version).toBe(2);
    expect(component.notice()).toContain('publicado');
  });

  it('no carga datos si falta el permiso de gestión', async () => {
    auth.has.and.returnValue(false);
    const fixture=TestBed.createComponent(HomeFlyersSettingsComponent);
    fixture.detectChanges();await fixture.whenStable();
    expect(api.list).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('No tienes permiso');
  });

  it('permite corregir una carga fallida sin perder el archivo elegido', async () => {
    api.upload.and.rejectWith(new Error('Storage no disponible'));
    const fixture=TestBed.createComponent(HomeFlyersSettingsComponent);
    const component=fixture.componentInstance;
    component.selectedDay.set(1);
    fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    const file=new File([new Uint8Array([1,2,3])],'prueba.png',{type:'image/png'});
    component.file=file;
    component.alt='Nuevo panfleto de baño del lunes';
    await component.save();
    expect(component.pending).toBeNull();
    expect(component.file).toBe(file);
    expect(component.error()).toContain('No se pudo subir');
    expect(api.save).not.toHaveBeenCalled();
  });

  it('abre la imagen elegida en un modal y devuelve el foco al cerrar', async () => {
    const fixture=TestBed.createComponent(HomeFlyersSettingsComponent);
    const component=fixture.componentInstance;
    component.selectedDay.set(1);
    fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const choose=root.querySelector<HTMLButtonElement>('button[aria-label="Ampliar vista previa del panfleto"]');
    expect(choose).not.toBeNull();
    const trigger=root.querySelector<HTMLButtonElement>('button:has(+ span[role="status"])');
    expect(trigger?.textContent).toContain('Elegir imagen');
    trigger!.focus();
    const input=root.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input,'files',{configurable:true,value:[new File(['imagen'],'panfleto.png',{type:'image/png'})]});
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.previewOpen()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    await fixture.whenStable();
    expect(root.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBeTrue();
    root.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click();
    fixture.detectChanges();
    await Promise.resolve();
    expect(component.previewOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);
    expect(fixture.nativeElement.textContent).toContain('panfleto.png');
  });
});
