import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'primary' | 'danger' | 'warning' | 'success';
  params?: any;
  showInput?: boolean;
  inputValue?: any;
  inputPlaceholder?: string;
}

export interface ConfirmResult {
  confirmed: boolean;
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private displaySubject = new BehaviorSubject<ConfirmOptions | null>(null);
  public display$ = this.displaySubject.asObservable();

  private resolveCallback: ((value: ConfirmResult) => void) | null = null;

  constructor() {}

  /**
   * Opens a confirmation dialog and returns a promise that resolves with the user's choice.
   */
  confirm(options: ConfirmOptions): Promise<ConfirmResult> {
    this.displaySubject.next(options);
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
    });
  }

  /**
   * Closes the dialog and resolves the promise with the specified result.
   */
  close(confirmed: boolean, value?: any): void {
    if (this.resolveCallback) {
      this.resolveCallback({ confirmed, value });
      this.resolveCallback = null;
    }
    this.displaySubject.next(null);
  }
}
