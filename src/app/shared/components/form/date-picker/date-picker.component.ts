
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { LabelComponent } from '../label/label.component';

@Component({
  selector: 'app-date-picker',
  imports: [LabelComponent],
  templateUrl: './date-picker.component.html',
  styles: ``
})
export class DatePickerComponent {

  @Input() id!: string;
  @Input() mode: 'single' | 'multiple' | 'range' | 'time' = 'single';
  @Input() defaultDate?: string | Date | string[] | Date[];
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() value?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() spanish = false;
  @Input() customOnMobile = false;
  @Input() aboveModal = false;
  @Output() dateChange = new EventEmitter<any>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      mode: this.mode,
      static: !this.aboveModal,
      monthSelectorType: 'static',
      dateFormat: 'Y-m-d',
      defaultDate: this.value || this.defaultDate,
      locale: this.spanish ? Spanish : 'default',
      disableMobile: this.customOnMobile,
      onReady: (_dates, _dateStr, instance) => {
        if (this.aboveModal) instance.calendarContainer.classList.add('z-[100000]!');
      },
      onChange: (selectedDates, dateStr, instance) => {
        if (!this.disabled) this.dateChange.emit({ selectedDates, dateStr, instance });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disabled'] && this.disabled) this.flatpickrInstance?.close();
    if (changes['value'] && this.flatpickrInstance && this.value !== undefined) {
      if (this.value) this.flatpickrInstance.setDate(this.value, false);
      else this.flatpickrInstance.clear(false);
    }
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}
