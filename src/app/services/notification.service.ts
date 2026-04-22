import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  isDialog?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  params?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor() {}

  show(notification: Omit<Notification, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    this.notificationSubject.next({ ...notification, id });
  }

  success(message: string, title: string = 'COMMON.SUCCESS') {
    this.show({ type: 'success', title, message, duration: 4000 });
  }

  error(message: string, title: string = 'COMMON.ERROR', params?: any) {
    this.show({ type: 'error', title, message, duration: 6000, params });
  }

  info(message: string, title: string = 'COMMON.INFO') {
    this.show({ type: 'info', title, message, duration: 4000 });
  }

  warning(message: string, title: string = 'COMMON.WARNING', params?: any) {
    this.show({ type: 'warning', title, message, duration: 5000, params });
  }

  confirm(message: string, onConfirm: () => void, options: { title?: string, confirmLabel?: string, cancelLabel?: string, onCancel?: () => void, params?: any } = {}) {
    this.show({
      type: 'info',
      isDialog: true,
      title: options.title || 'COMMON.CONFIRMATION',
      message,
      confirmLabel: options.confirmLabel || 'COMMON.CONFIRM',
      cancelLabel: options.cancelLabel || 'COMMON.CANCEL',
      onConfirm,
      onCancel: options.onCancel,
      params: options.params
    });
  }
}
