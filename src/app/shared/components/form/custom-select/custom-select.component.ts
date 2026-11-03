import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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
  @Input() disabled = false;
  @Input() ariaLabel = 'Seleccionar una opción';
  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;

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
    if (changes['disabled'] && this.disabled) this.isOpen = false;
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
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  selectOption(option: CustomSelectOption) {
    if (this.disabled) return;
    this.value = option.value;
    this.selectedLabel = option.label;
    this.valueChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    event.stopPropagation();
    this.trigger?.nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
