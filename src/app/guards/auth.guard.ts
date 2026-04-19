import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const user = this.authService.currentUserValue;
    if (user) {
      // Logic for role check if needed on specific routes
      if (route.data['roles'] && !route.data['roles'].includes(user.role)) {
        this.router.navigate(['/']); // Redirect to home/dashboard if unauthorized
        return false;
      }
      return true;
    }

    // Not logged in, redirect to login page with selection of return URL
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
