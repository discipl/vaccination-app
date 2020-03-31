import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Appointment,
  AppointmentActionRequest,
  AppointmentStatus,
  AvailableAction,
  DEFAULT_POSITION
} from 'src/models/appointments-model';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Role } from 'src/models/user-model';
import { AppointmentsService } from '../appointments.service';
import { ToastService } from 'src/app/core/toast.service';
import { LoaderService } from 'src/app/core/loader.service';
import { BarcodeScanner, BarcodeScanResult } from '@ionic-native/barcode-scanner/ngx';
import { finalize } from 'rxjs/operators';
import { TranslateService } from "@ngx-translate/core";
import { GoogleMap, GoogleMapOptions, GoogleMaps, LatLng } from '@ionic-native/google-maps';
import { ModalController } from "@ionic/angular";
import { QrcodePage } from "../../qrcode/qrcode.page";
import { LanguageService } from "../../core/language.service";
import {VaccineType} from "../../../models/vaccines.model";
import {formatVaccineType} from "../../core/vaccineType.Helper";

@Component({
  selector: 'app-appointment-detail',
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.scss'],
})
export class AppointmentDetailComponent {
  @ViewChild('map') mapElement: ElementRef;
  map: GoogleMap;
  appointment: Appointment;
  position: LatLng;
  objStatus = AppointmentStatus;
  objAvailableActions = AvailableAction;
  healthcareProviderError: any;
  checkedVaccines: String[] = [];

  constructor(private route: ActivatedRoute,
              private router: Router,
              private toastService: ToastService,
              private translateService: TranslateService,
              private authService: AuthService,
              private appointmentsService: AppointmentsService,
              private loading: LoaderService,
              private barcodeScanner: BarcodeScanner,
              private modalController: ModalController,
              private languageService: LanguageService) {
  }

  ionViewWillEnter() {
    this.healthcareProviderError = '';
    this.loading.present();
  }

  ionViewDidEnter() {
    this.appointmentsService.getAppointment(this.route.snapshot.params['appointmentId']).subscribe((res: Appointment) => {
      this.appointment = res;
      const location = this.appointment.place;
      this.position = location && location.latitude && location.longitude ?
        new LatLng(location.latitude, location.longitude) :
        new LatLng(DEFAULT_POSITION.lat, DEFAULT_POSITION.lng);
      setTimeout(this.loadMap.bind(this));
      this.loading.dismiss();
    });
  }

  hasAction(action: AvailableAction): boolean {
    return this.appointment.availableActions.includes(action);
  }

  get isHealthcareProvider(): boolean {
    return this.authService.role === Role.HealthcareProvider;
  }

  get fullName(): string {
    const human = this.isHealthcareProvider ? this.appointment.student : this.appointment.hcProvider;
    return human && `${human.firstName} ${human.lastName}`;
  }

  loadMap() {
    const mapOptions: GoogleMapOptions = {
      camera: {
        target: this.position,
        zoom: 18
      },
      mapType: 'MAP_TYPE_ROADMAP',
      controls: { zoom: true },
    };

    this.map = GoogleMaps.create(this.mapElement.nativeElement, mapOptions);

    this.map.addMarkerSync({
      title: this.appointment.place.address,
      icon: 'blue',
      animation: 'DROP',
      position: this.position
    });
  }

  check() {
    this.barcodeScanner.scan()
      .then(barcodeData => {
        if (!barcodeData.cancelled) {
          this.confirmOpponent(barcodeData);
        }
      })
      .catch(() => {
      });
  }

  confirmOpponent(data: BarcodeScanResult) {
    this.healthcareProviderError = '';
    const text = JSON.parse(data.text);
    let {appointmentId, token} = text;
    if (this.authService.role === Role.HealthcareProvider && appointmentId !== this.appointment._id) {
      this.toastService.presentToast(this.translateService.instant('Appointments.incorrectAppointmentId'));
    } else {
      this.doAction({action: AvailableAction.CONFIRM_OPPONENT, token});
    }
  }

  share() {
    this.loading.present();

    this.appointmentsService.shareToken(this.appointment._id).subscribe(async res => {
        const modal = await this.modalController.create({
          component: QrcodePage,
          componentProps: {
            value: JSON.stringify({appointmentId: this.appointment._id, token: res.token}),
            role: this.authService.role,
          }
        });
        await modal.present();
        this.loading.dismiss();

        await modal.onDidDismiss();
        this.ionViewDidEnter();
      },
      (err) => {
        this.loading.dismiss();
        this.toastService.presentToast(JSON.stringify(err.error.message));
      });
  }

  done() {
    this.doAction({action: AvailableAction.FINISH});
  }

  scanVaccine() {
    this.barcodeScanner.scan()
      .then(barcodeData => {
        if (!barcodeData.cancelled) {
          const batchCodes = this.appointment.vaccines.map(v => v.batchCode);
          const batchCode = barcodeData.text;
          if (batchCodes.includes(batchCode)) {
            this.checkedVaccines.push(batchCode);
          } else {
            this.toastService.presentToast(this.translateService.instant('Appointments.Vaccine isn\'t at the appointment'));
          }
        }
      })
      .catch(() => {
      });
  }

  isVaccineChecked(batchCode) {
    return this.checkedVaccines.includes(batchCode);
  }

  doAction(request: AppointmentActionRequest) {
    this.loading.present();

    this.appointmentsService.actionOfAppointment(this.appointment._id, request)
      .pipe(finalize(() => this.loading.dismiss()))
      .subscribe(
        res => this.appointment = res,
        err => {
          if (err.status === 409 && request.action === AvailableAction.CONFIRM_OPPONENT) {
            if (err.error.healthcareProvider) {
              this.healthcareProviderError = `${err.error.healthcareProvider.firstName} ${err.error.healthcareProvider.lastName}`;
            } else {
              this.healthcareProviderError = this.translateService.instant('General.Unknown');
            }
          }
        }
      )
  }

  doRefresh(event) {
    const appointmentId = this.route.snapshot.params['appointmentId'];
    this.appointmentsService.getAppointment(appointmentId).subscribe((res: Appointment) => {
      this.appointment = res;
      event.target.complete();
    });
  }

  getLocale() {
    return this.languageService.selected;
  }

  allVaccinesChecked() {
    return this.checkedVaccines.length === this.appointment.vaccines.length;
  }

  formatVaccineType(type: VaccineType) {
    return formatVaccineType(type);
  }
}
