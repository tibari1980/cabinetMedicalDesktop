import { Injectable } from '@angular/core';
import { AppointmentService } from './appointment.service';
import { PatientService } from './patient.service';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { map } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService
  ) {}

  getPerformanceStats(): Observable<any> {
    return combineLatest([
      this.appointmentService.appointments$,
      this.patientService.patients$
    ]).pipe(
      map(([appointments, patients]) => {
        const stats = {
          totalRevenue: 0,
          revenueByDay: [] as { date: string, amount: number }[],
          appointmentTypes: { consultation: 0, control: 0, emergency: 0 },
          patientGrowth: [] as { month: string, count: number }[],
          averageFee: 0
        };

        // Revenue over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentApts = appointments.filter(a => new Date(a.date) >= thirtyDaysAgo && a.status !== AppointmentStatus.CANCELLED);
        
        // Group by day for the line chart
        const dailyMap = new Map<string, number>();
        recentApts.forEach(a => {
          const day = a.date;
          dailyMap.set(day, (dailyMap.get(day) || 0) + (a.fee || 0));
          
          // Type distribution
          if (a.type.toLowerCase().includes('consultation')) stats.appointmentTypes.consultation++;
          else if (a.type.toLowerCase().includes('contrôle')) stats.appointmentTypes.control++;
          else stats.appointmentTypes.emergency++;
          
          stats.totalRevenue += (a.fee || 0);
        });

        stats.revenueByDay = Array.from(dailyMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, amount]) => ({ date, amount }));

        stats.averageFee = recentApts.length > 0 ? stats.totalRevenue / recentApts.length : 0;

        return stats;
      })
    );
  }
}
