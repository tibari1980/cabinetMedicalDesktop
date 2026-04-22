import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-search-input',
  template: `
    <div [class]="'relative group ' + customClass">
      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg transition-colors group-focus-within:text-primary" aria-hidden="true">search</span>
      <input [ngModel]="value" (ngModelChange)="onValueChange($event)"
             class="w-full bg-surface-container-low border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium transition-all shadow-inner-sm" 
             [placeholder]="placeholder | translate" type="text"/>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInputComponent {
  @Input() value: string = '';
  @Input() placeholder: string = 'COMMON.SEARCH';
  @Input() customClass: string = 'w-full max-w-sm';
  @Output() valueChange = new EventEmitter<string>();

  onValueChange(val: string) {
    this.valueChange.emit(val);
  }
}
