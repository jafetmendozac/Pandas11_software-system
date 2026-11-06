import { TestBed } from '@angular/core/testing';
import { CustomSelectComponent } from './custom-select.component';

describe('CustomSelectComponent', () => {
  it('muestra una opción deshabilitada sin permitir seleccionarla', () => {
    const fixture = TestBed.createComponent(CustomSelectComponent);
    const component = fixture.componentInstance;
    component.options = [{ value: 'ocupado', label: 'Ocupado', disabled: true }, { value: 'libre', label: 'Libre' }];
    const emit = spyOn(component.valueChange, 'emit');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('[role="option"]') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBeTrue();
    component.selectOption(component.options[0]);expect(emit).not.toHaveBeenCalled();
    buttons[1].click();expect(emit).toHaveBeenCalledWith('libre');
  });
});
