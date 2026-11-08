import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, HostListener, SimpleChanges, ViewChild } from '@angular/core';

export interface Option {
  value: string;
  text: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-multi-select',
  imports: [
    CommonModule,
  ],
  templateUrl: './multi-select.component.html',
  styles: ``
})
export class MultiSelectComponent {

  @Input() label: string = '';
  @Input() options: Option[] = [];
  @Input() defaultSelected: string[] = [];
  @Input() selected?: readonly string[];
  @Input() placeholder = 'Selecciona opciones';
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();
  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;

  selectedOptions: string[] = [];
  isOpen = false;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.selectedOptions = [...(this.selected ?? this.defaultSelected)];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selected'] && this.selected !== undefined) this.selectedOptions = [...this.selected];
    if (changes['disabled'] && this.disabled) this.isOpen = false;
  }

  toggleDropdown() {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  handleSelect(optionValue: string) {
    if (this.disabled || !this.options.some(option => option.value === optionValue && !option.disabled)) return;
    if (this.selectedOptions.includes(optionValue)) {
      this.selectedOptions = this.selectedOptions.filter(v => v !== optionValue);
    } else {
      this.selectedOptions = [...this.selectedOptions, optionValue];
    }
    this.selectionChange.emit(this.selectedOptions);
  }

  removeOption(event: Event, value: string) {
    event.stopPropagation();
    if (this.disabled) return;
    this.selectedOptions = this.selectedOptions.filter(opt => opt !== value);
    this.selectionChange.emit(this.selectedOptions);
  }

  optionText(value: string): string {
    return this.options.find(option => option.value === value)?.text || '';
  }

  get selectedValuesText(): string[] {
    return this.selectedOptions
      .map(value => this.options.find(option => option.value === value)?.text || '')
      .filter(Boolean);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.isOpen = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (!this.isOpen) return;
    this.isOpen = false;
    event.stopPropagation();
    this.trigger?.nativeElement.focus();
  }
}
