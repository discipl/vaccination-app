import {Component, ElementRef, ViewChild} from '@angular/core';
import {GoogleMap, GoogleMapOptions, GoogleMaps, LatLng} from "@ionic-native/google-maps";
import {ActivatedRoute, Router} from "@angular/router";
import {Event} from "../../../models/events-model";
import {ToastService} from "../../core/toast.service";
import {TranslateService} from "@ngx-translate/core";
import {AuthService} from "../../core/auth/auth.service";
import {EventsService} from "../events.service";
import {LoaderService} from "../../core/loader.service";
import {DEFAULT_POSITION} from "../../../models/appointments-model";
import {ModalController} from "@ionic/angular";
import {LanguageService} from "../../core/language.service";
import {Role} from "../../../models/user-model";
import {finalize} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {environmentExample} from "../../../environments/environment.example";

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent {
  @ViewChild('map') mapElement: ElementRef;
  map: GoogleMap;
  event: Event;
  position: LatLng;
  chosenDate;
  chosenDateMsg;
  healthcareProviderError: any;
  students;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private toastService: ToastService,
              private translateService: TranslateService,
              private authService: AuthService,
              private eventsService: EventsService,
              private loading: LoaderService,
              private modalController: ModalController,
              private languageService: LanguageService,
              private http: HttpClient) {
  }

  ionViewWillEnter() {
    this.chosenDateMsg = '';
    this.chosenDate = undefined;
    this.healthcareProviderError = '';
    this.loading.present();
  }

  ionViewDidEnter() {
    this.eventsService.getEvent(this.route.snapshot.params['eventId']).subscribe((res: Event) => {
      this.event = res;
      const location = this.event.place;
      this.position = location && location.latitude && location.longitude ?
        new LatLng(location.latitude, location.longitude) :
        new LatLng(DEFAULT_POSITION.lat, DEFAULT_POSITION.lng);
      setTimeout(this.loadMap.bind(this));
      if (!this.isStudent()) {
        this.http.get(environmentExample.endPoint + 'vaccinations/events/' + this.event._id + '/students').toPromise()
          .then(res => {
            this.students = res;
          });
      }
      this.loading.dismiss();
    });
  }

  loadMap() {
    const mapOptions: GoogleMapOptions = {
      camera: {
        target: this.position,
        zoom: 18
      },
      mapType: 'MAP_TYPE_ROADMAP',
      controls: {zoom: true},
    };

    this.map = GoogleMaps.create(this.mapElement.nativeElement, mapOptions);

    this.map.addMarkerSync({
      title: this.event.place.address,
      icon: 'blue',
      animation: 'DROP',
      position: this.position
    });
  }

  doRefresh(event) {
    const appointmentId = this.route.snapshot.params['eventId'];
    this.eventsService.getEvent(appointmentId).subscribe((res: Event) => {
      this.event = res;
      event.target.complete();
    });
  }

  getLocale() {
    return this.languageService.selected;
  }

  register() {
    this.loading.present();

    this.eventsService.createAppointment(this.event._id, this.chosenDate)
      .pipe(finalize(() => this.loading.dismiss()))
      .subscribe(
        res => this.router.navigate([`tabs/appointments/${res._id}`]),
        err => {
          if (err.status === 400) {
            this.chosenDateMsg = err.error.fields[0].message;
          }
        }
      )
  }

  choseDate(date) {
    this.chosenDateMsg = '';
    this.chosenDate = date;
  }

  isStudent() {
    return this.authService.getRole() === Role.Student;
  }
}

