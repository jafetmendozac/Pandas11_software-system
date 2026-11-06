import { TestBed } from '@angular/core/testing';
import { MultiSelectComponent } from './multi-select.component';

describe('MultiSelectComponent', () => {
  it('permite elegir varios valores y sincroniza cambios externos', () => {
    const fixture = TestBed.createComponent(MultiSelectComponent);
    fixture.componentRef.setInput('label', 'Servicios');
    fixture.componentRef.setInput('options', [{ value: 'a', text: 'Baño' }, { value: 'b', text: 'Corte' }]);
    fixture.componentRef.setInput('selected', ['a']);
    const emit = spyOn(fixture.componentInstance.selectionChange, 'emit');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('button[role="option"]') as NodeListOf<HTMLButtonElement>;
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    options[1].click();expect(emit).toHaveBeenCalledWith(['a','b']);
    fixture.componentRef.setInput('selected', ['b']);fixture.detectChanges();
    expect(trigger.textContent?.trim()).toContain('Corte');
    expect(trigger.textContent?.trim()).not.toContain('Baño');
  });

  it('no permite cambiar la selección cuando está deshabilitado', () => {
    const fixture = TestBed.createComponent(MultiSelectComponent);
    fixture.componentRef.setInput('options', [{ value: 'a', text: 'Baño' }]);
    fixture.componentRef.setInput('selected', ['a']);
    fixture.componentRef.setInput('disabled', true);
    const emit = spyOn(fixture.componentInstance.selectionChange, 'emit');
    fixture.detectChanges();
    fixture.componentInstance.handleSelect('a');
    fixture.componentInstance.removeOption('a');
    expect(emit).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedOptions).toEqual(['a']);
  });
});
