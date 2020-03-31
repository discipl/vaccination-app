import {Component} from '@angular/core';
import {NavParams} from "@ionic/angular";

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.page.html',
  styleUrls: ['./qrcode.page.scss'],
})
export class QrcodePage {

  value: String;
  role: String;

  constructor(private navParams: NavParams) {
    this.value = navParams.data.value;
    this.role = navParams.data.role;
  }

  close() {
    this.navParams.data.modal.dismiss();
  }
}
