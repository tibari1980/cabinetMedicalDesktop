import { Component, OnInit, OnDestroy } from '@angular/core';
import { StatisticsService } from '../../../services/statistics.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html'
})
export class PerformanceComponent implements OnInit, OnDestroy {
  stats: any = null;
  private sub!: Subscription;

  constructor(private statsService: StatisticsService) {}

  ngOnInit(): void {
    this.sub = this.statsService.getPerformanceStats().subscribe(data => {
      this.stats = data;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Helpers for SVG charting
  getMaxRevenue(): number {
    if (!this.stats || this.stats.revenueByDay.length === 0) return 1000;
    return Math.max(...this.stats.revenueByDay.map((d: any) => d.amount)) * 1.2;
  }

  getLinePoints(): string {
    if (!this.stats || this.stats.revenueByDay.length === 0) return '';
    const max = this.getMaxRevenue();
    const count = this.stats.revenueByDay.length;
    return this.stats.revenueByDay.map((d: any, i: number) => {
      const x = count > 1 ? (i / (count - 1)) * 100 : 50;
      const y = 100 - (d.amount / max) * 100;
      return `${x},${y}`;
    }).join(' ');
  }
}
