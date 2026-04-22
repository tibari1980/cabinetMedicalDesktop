import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DialogService, ConfirmOptions } from '../../../services/dialog.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('backdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ]
})
export class ConfirmDialogComponent {
  options: ConfirmOptions | null = null;

  constructor(
    public dialogService: DialogService,
    private cdr: ChangeDetectorRef
  ) {
    this.dialogService.display$.subscribe(options => {
      this.options = options;
      this.cdr.markForCheck();
    });
  }

  confirm() {
    this.dialogService.close(true, this.options?.inputValue);
  }

  cancel() {
    this.dialogService.close(false);
  }
}
