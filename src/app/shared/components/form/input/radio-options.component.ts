import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface RadioOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-radio-options',
  standalone: true,
  template: `
    <fieldset class="min-w-0">
      <legend class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">{{ label }}</legend>
      @if (helpText) {
        <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">{{ helpText }}</p>
      }
      <div class="grid gap-2 sm:grid-cols-2">
        @for (option of options; track option.value) {
          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 dark:border-gray-700 dark:text-gray-300 dark:has-[:checked]:border-brand-400 dark:has-[:checked]:bg-brand-500/10">
            <input [name]="name" type="radio" [value]="option.value" [checked]="value === option.value" (change)="valueChange.emit(option.value)" class="h-4 w-4 accent-brand-400 focus-visible:outline-2 focus-visible:outline-brand-500" />
            <span>{{ option.label }}</span>
          </label>
        }
      </div>
    </fieldset>
  `,
})
export class RadioOptionsComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) label = '';
  @Input() helpText = '';
  @Input() options: readonly RadioOption[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
