import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        query('.animate-item', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('800ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class LandingComponent implements OnInit {
  mouseX = 0;
  mouseY = 0;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // If already logged in, offer to go to dashboard
    const user = this.authService.currentUserValue;
    if (user) {
      // Potentially redirect or show a different CTA
    }
  }

  onMouseMove(event: MouseEvent) {
    // Calculate normalized mouse position for 3D effect
    this.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    this.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  }

  get3DTransform() {
    return `perspective(1000px) rotateY(${this.mouseX * 15}deg) rotateX(${-this.mouseY * 15}deg)`;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
