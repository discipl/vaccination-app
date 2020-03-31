import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppointmentsComponent } from './appointments/appointments.component';
import { AppointmentDetailComponent } from './appointment-detail/appointment-detail.component';

const routes: Routes = [
  { path: '', component: AppointmentsComponent },
  { path: ':appointmentId', component: AppointmentDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
