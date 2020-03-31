import { Injectable } from '@angular/core';
import { environmentExample } from "../../environments/environment.example";
import { Observable } from "rxjs/index";
import { HttpClient } from "@angular/common/http";
import {Event, EventsResponse} from "../../models/events-model";
import {AuthService} from "../core/auth/auth.service";
import {Role} from "../../models/user-model";
import {Appointment} from "../../models/appointments-model";

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  constructor(private http: HttpClient,
              private authService: AuthService) { }

  listOfEvents(): Observable<EventsResponse> {
    const params = {};
    if (this.authService.getRole() === Role.HealthcareProvider) {
      params['bigId'] = this.authService.user.bigId;
    }
    return this.http.get<EventsResponse>(environmentExample.endPoint + 'vaccinations/events', { params });
  }

  getEvent(eventId): Observable<Event> {
    return this.http.get<Event>(`${environmentExample.endPoint}vaccinations/events/${eventId}`);
  }

  createAppointment(eventId: string, chosenDate){
    return this.http.put<Appointment>(`${environmentExample.endPoint}appointments`, { event: eventId, chosenDate });
  }
}
