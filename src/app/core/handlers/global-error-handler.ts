import { ErrorHandler, Injectable, NgZone, Injector } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private zone: NgZone,
    private injector: Injector
  ) {}

  handleError(error: any): void {
    const notificationService = this.injector.get(NotificationService);
    // Audit log (Expert Practice)
    console.group('🛡️ SaaS Persistence & Security Guard');
    console.error('An unexpected error occurred:', error);
    console.groupEnd();

    // Prevent application crash loop by notifying user in a safe zone
    this.zone.run(() => {
      // In a real production app, we would send this to Sentry or LogRocket
      // For this SaaS, we show a clean console log and prevent UI whiteouts
      if (error?.message?.includes('quota')) {
        notificationService.error('Alerte Système : La mémoire locale de votre navigateur est presque saturée. Veuillez nettoyer vos anciens rendez-vous ou exporter vos données.', 'Alerte Quota');
      }
    });

    // Re-throw if critical, but prevent default browser handling that might freeze the UI
  }
}
