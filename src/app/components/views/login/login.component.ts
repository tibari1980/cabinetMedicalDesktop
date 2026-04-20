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
  returnUrl = '/';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    // If already logged in, redirect
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit() {
    this.authService.login(this.username, this.password).subscribe(success => {
      if (success) {
        this.router.navigate([this.returnUrl]);
      } else {
        this.error = 'Identifiant incorrect';
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
