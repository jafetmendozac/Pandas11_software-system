import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CustomSelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
})
export class CustomSelectComponent implements OnInit, OnChanges {
  @Input() options: CustomSelectOption[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() className: string = '';
  @Input() defaultValue: string | number | null = null;
  @Input() value: string | number | null = null;

  @Output() valueChange = new EventEmitter<string | number | null>();

  isOpen: boolean = false;
  selectedLabel: string = '';

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.updateSelectedLabel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['options'] || changes['defaultValue']) {
      this.updateSelectedLabel();
    }
  }

  updateSelectedLabel() {
    const selectedOption = this.options.find(option => option.value === this.value);
    if (selectedOption) {
      this.selectedLabel = selectedOption.label;
    } else if (this.defaultValue) {
      const defaultOption = this.options.find(option => option.value === this.defaultValue);
      if (defaultOption) {
        this.value = this.defaultValue;
        this.selectedLabel = defaultOption.label;
      } else {
        this.selectedLabel = this.placeholder;
      }
    } else {
      this.selectedLabel = this.placeholder;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: CustomSelectOption) {
    this.value = option.value;
    this.selectedLabel = option.label;
    this.valueChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}