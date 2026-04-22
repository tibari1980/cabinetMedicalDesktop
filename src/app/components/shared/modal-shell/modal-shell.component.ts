import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-modal-shell',
  template: `
    <div *ngIf="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8" [@backdrop]>
      <!-- Immersive Radial Overlay -->
      <div class="absolute inset-0 bg-on-surface/30 backdrop-blur-[10px] transition-all" (click)="onClose()">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-tertiary/5"></div>
      </div>
      
      <!-- Modal Glass Shell -->
      <div [class]="'bg-surface-container-lowest dark:bg-[#1a1c1e] w-full ' + maxWidth + ' rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/20 dark:border-white/5'"
           role="dialog"
           aria-modal="true"
           [attr.aria-labelledby]="modalTitleId"
           [@modal]>
        <!-- Decorative Glow Elements -->
        <div class="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-30 select-none"></div>
        <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-tertiary/20 rounded-full blur-3xl opacity-30 select-none"></div>

        <!-- Header -->
        <div class="p-8 border-b border-outline-variant/10 flex justify-between items-center relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-2xl" aria-hidden="true">{{ icon }}</span>
            </div>
            <div>
              <h3 [id]="modalTitleId" class="text-2xl font-black text-on-surface tracking-tight">{{ title | translate }}</h3>
              <p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-0.5 opacity-60">{{ subtitle | translate }}</p>
            </div>
          </div>
          <button (click)="onClose()" aria-label="Fermer la modale" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error/10 hover:text-error transition-all group">
            <span class="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto relative z-10 custom-scrollbar">
          <ng-content select="[modal-body]"></ng-content>
        </div>

        <!-- Footer (Actions) -->
        <div class="p-8 bg-surface-container-low/40 backdrop-blur-xl flex gap-4 relative z-10 border-t border-outline-variant/10">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalShellComponent {
  @Input() show: boolean = false;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'info';
  @Input() maxWidth: string = 'max-w-xl';
  @Output() close = new EventEmitter<void>();

  modalTitleId = 'modal-title-' + Math.random().toString(36).substr(2, 9);

  onClose() {
    this.close.emit();
  }
}
