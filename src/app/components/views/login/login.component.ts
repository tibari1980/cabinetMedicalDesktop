import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  hidePassword = true;
  error = '';
  errors: any = {};
  returnUrl = '/dashboard';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    // If already logged in, redirect
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit() {
    this.errors = {};
    if (!this.username?.trim()) this.errors.username = true;
    if (!this.password?.trim()) this.errors.password = true;

    if (Object.keys(this.errors).length > 0) {
      return;
    }

    this.authService.login(this.username, this.password).subscribe(success => {
      if (success) {
        this.router.navigate([this.returnUrl]);
      } else {
        this.error = 'VALIDATION.INVALID_CREDENTIALS';
      }
    });
  }

  // Helper for demo
  selectDemoUser(username: string) {
    this.username = username;
    this.password = 'demo123';
    this.onSubmit();
  }
}
