import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  toasts: Notification[] = [];
  activeDialog: Notification | null = null;
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription.add(
      this.notificationService.notifications$.subscribe(notif => {
        if (notif.isDialog) {
          this.activeDialog = notif;
        } else {
          this.toasts.push(notif);
          if (notif.duration) {
            setTimeout(() => this.removeToast(notif.id), notif.duration);
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  confirmDialog() {
    if (this.activeDialog?.onConfirm) {
      this.activeDialog.onConfirm();
    }
    this.activeDialog = null;
  }

  cancelDialog() {
    if (this.activeDialog?.onCancel) {
      this.activeDialog.onCancel();
    }
    this.activeDialog = null;
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      default: return 'text-sky-500';
    }
  }
}
