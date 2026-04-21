import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SetupGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const setupComplete = localStorage.getItem('mf_setup_complete');
    const users = localStorage.getItem('mf_users');

    if (!setupComplete && (!users || JSON.parse(users).length === 0)) {
      // First launch detected — redirect to setup wizard
      this.router.navigate(['/setup']);
      return false;
    }
    return true;
  }
}
