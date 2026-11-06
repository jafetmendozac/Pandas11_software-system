
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-time-picker',
  imports: [],
  templateUrl: './time-picker.component.html',
  styles: ``
})
export class TimePickerComponent {

  @Input() id!: string;
  @Input() label: string = 'Time Select Input';
  @Input() placeholder: string = 'Select time';
  @Input() defaultTime?: string | Date;
  @Input() value?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() enableSeconds = false;
  @Input() use24Hour = false;
  @Input() customOnMobile = false;
  @Input() aboveModal = false;

  @Output() timeChange = new EventEmitter<string>();

  @ViewChild('timeInput', { static: false }) timeInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    this.flatpickrInstance = flatpickr(this.timeInput.nativeElement, {
      enableTime: true,
      noCalendar: true,
      dateFormat: this.enableSeconds ? 'H:i:S' : 'H:i',
      enableSeconds: this.enableSeconds,
      time_24hr: this.use24Hour,
      disableMobile: this.customOnMobile,
      onReady: (_dates, _dateStr, instance) => {
        if (this.aboveModal) instance.calendarContainer.classList.add('z-[100000]!');
      },
      minuteIncrement: 1,
      defaultDate: this.value || this.defaultTime,
      onChange: (selectedDates, dateStr) => {
        if (!this.disabled) this.timeChange.emit(dateStr);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['disabled'] && this.disabled) this.flatpickrInstance?.close();
    if (changes['value'] && this.flatpickrInstance && this.value !== undefined) {
      if (this.value) this.flatpickrInstance.setDate(this.value, false, this.enableSeconds ? 'H:i:S' : 'H:i');
      else this.flatpickrInstance.clear(false);
    }
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}
