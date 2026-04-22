import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-form-error',
  template: `
    <p *ngIf="error" [id]="id" role="alert" class="text-[10px] font-bold text-error mt-1 pl-1 animate-fade-in">
      {{ translationKey | translate:params }}
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormErrorComponent {
  @Input() id: string = '';
  @Input() error: any;
  @Input() translationKey: string = '';
  @Input() params: any = {};
}
