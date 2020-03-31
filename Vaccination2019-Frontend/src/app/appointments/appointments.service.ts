import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environmentExample } from 'src/environments/environment.example';
import { Appointment, AppointmentActionRequest } from 'src/models/appointments-model';
import {Token} from "../../models/token";

@Injectable()
export class AppointmentsService {

  constructor(private http: HttpClient) { }

  listOfAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(environmentExample.endPoint + 'appointments');
  }

  getAppointment(appointmentId): Observable<Appointment> {
    return this.http.get<Appointment>(`${environmentExample.endPoint}appointments/${appointmentId}`);
  }

  shareToken(appointmentId): Observable<Token> {
    return this.http.post<Token>(`${environmentExample.endPoint}appointments/${appointmentId}`, { action: 'SHARE_TOKEN' });
  }

  actionOfAppointment(appointmentId: string, action: AppointmentActionRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${environmentExample.endPoint}appointments/${appointmentId}`, action);
  }
}
