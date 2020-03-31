import { Component, ViewChild, } from '@angular/core';
import { AuthService } from "../core/auth/auth.service";
import { Router } from "@angular/router";
import { LanguageService } from "../core/language.service";
import { LoaderService } from "../core/loader.service";
import { Event } from "../../models/events-model";
import { EventsService } from "./events.service";
import { IonInfiniteScroll } from "@ionic/angular";
import {HttpClient} from "@angular/common/http";
import {environmentExample} from "../../environments/environment.example";

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;

  events: Event[] = [];

  constructor(
    private eventsService: EventsService,
    private router: Router,
    private loading: LoaderService,
    private authService: AuthService,
    private languageService: LanguageService) {
  }

  ionViewDidEnter() {
    this.loadEvents();
  }

  loadEvents(event?) {
    !event && this.loading.present();
    this.eventsService.listOfEvents().subscribe(res => {
      this.events = res.items.map(e => {
        const event = new Event();
        Object.assign(event, e);
        return event;
      });

      if (event && event.target && event.target.complete) {
        event.target.complete();
      } else {
        this.loading.dismiss();
      }
    });
  }

  showDetails(event: Event) {
    this.router.navigate([`/tabs/events/${event._id}`]);
  }

  doRefresh(event: CustomEvent) {
    this.loadEvents(event);
  }

  getLocale() {
    return this.languageService.selected;
  }

}