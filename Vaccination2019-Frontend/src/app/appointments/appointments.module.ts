import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsComponent } from './appointments/appointments.component';
import { TranslateModule } from '@ngx-translate/core';
import { AppointmentDetailComponent } from './appointment-detail/appointment-detail.component';
import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsService } from './appointments.service';
import { QrcodePage } from "../qrcode/qrcode.page";
import {QRCodeModule} from "angular2-qrcode";
import {QrcodePageModule} from "../qrcode/qrcode.module";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    AppointmentsRoutingModule,
    QRCodeModule,
    QrcodePageModule,
  ],
  declarations: [
    AppointmentsComponent,
    AppointmentDetailComponent
  ],
  providers: [
    AppointmentsService
  ],
  entryComponents: [QrcodePage]
})
export class AppointmentsModule { }
