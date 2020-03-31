import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsComponent } from "./events.component";
import { EventDetailComponent } from "./event-detail/event-detail.component";
import { EventsService } from "./events.service";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { QrcodePageModule } from "../qrcode/qrcode.module";
import { IonicModule } from "@ionic/angular";
import { QRCodeModule } from "angular2-qrcode";
import { EventsRoutingModule } from "./events-routing.module";
import { InfiniteScrollModule } from "ngx-infinite-scroll";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    EventsRoutingModule,
    QRCodeModule,
    QrcodePageModule,
    InfiniteScrollModule,
  ],
  declarations: [
    EventsComponent,
    EventDetailComponent
  ],
  providers: [
    EventsService
  ]
})
export class EventsModule { }
