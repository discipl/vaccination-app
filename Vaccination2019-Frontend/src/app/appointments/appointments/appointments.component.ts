import { Component } from '@angular/core';
import { AppointmentsService } from '../appointments.service';
import { Router } from '@angular/router';
import { Appointment, AppointmentStatus } from 'src/models/appointments-model';
import { LoaderService } from '../../core/loader.service';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../../models/user-model';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-appointments',
  templateUrl: 'appointments.component.html',
  styleUrls: ['appointments.component.scss']
})
export class AppointmentsComponent {
  appointments: Appointment[] = [];
  hideFinished = true;
  hasFinishedEvents: boolean;

  constructor(
      private appointmentsService: AppointmentsService,
      private router: Router,
      private loading: LoaderService,
      private authService: AuthService,
      private languageService: LanguageService) {
  }

  ionViewDidEnter() {
    this.loadAppointments();
  }

  loadAppointments(event?) {
    !event && this.loading.present();
    this.appointmentsService.listOfAppointments().subscribe(res => {
      const notFinishedEvents = res.filter(app => !this.hasFinishedStatus(app));
      const finishedEvents = res.filter(app => this.hasFinishedStatus(app));
      this.appointments = [...notFinishedEvents, ...finishedEvents].map(a => {
        const appointment = new Appointment();
        Object.assign(appointment, a);
        return appointment;
      });
      this.hasFinishedEvents = finishedEvents.length > 0;

      if (this.appointments.length === 0) {
        this.appointments = null;
      }

      if (event) {
        event.target.complete();
      } else {
        this.loading.dismiss();
      }
    });
  }

  hasFinishedStatus(appointment: Appointment): boolean {
    const hiddenStatuses = {
      [Role.HealthcareProvider]: [AppointmentStatus.FINISHED_BY_HEALTHCARE_PROVIDER, AppointmentStatus.FINISHED],
      [Role.Student]: [AppointmentStatus.FINISHED_BY_STUDENT, AppointmentStatus.FINISHED],
    };
    return hiddenStatuses[this.authService.role].includes(appointment.status)
  }

  isHidden(appointment: Appointment): boolean {
    return this.hideFinished && this.hasFinishedStatus(appointment);
  }

  showDetails(appointment: Appointment) {
    this.router.navigate([`/tabs/appointments/${appointment._id}`]);
  }

  doRefresh(event: CustomEvent) {
    this.loadAppointments(event);
  }

  showHidden() {
    this.hideFinished = false;
  }

  getLocale() {
    return this.languageService.selected;
  }
}
