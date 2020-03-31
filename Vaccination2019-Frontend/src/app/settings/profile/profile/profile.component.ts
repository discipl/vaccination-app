import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Role, User, UserVaccination } from 'src/models/user-model';
import { LanguagePopoverPage } from '../../../pages/language-popover/language-popover.page';
import { PopoverController } from '@ionic/angular';
import { HttpClient } from "@angular/common/http";
import { environmentExample } from "../../../../environments/environment.example";
import { Token } from "../../../../models/token";
import { LanguageService } from "../../../core/language.service";
import { formatVaccineType} from "../../../core/vaccineType.Helper";
import {VaccineType} from "../../../../models/vaccines.model";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  user: User;
  tokenData: String;
  vaccines: UserVaccination[];
  vaccinesOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private popoverCtrl: PopoverController,
    private http: HttpClient,
    private languageService: LanguageService
  ) {
    this.user = this.authService.user;
  }

  ionViewWillEnter() {
    if (this.user.role === Role.HealthcareProvider) {
      this.http.post<Token>(`${environmentExample.endPoint}users/${this.user._id}/token`, {}).toPromise()
        .then(res => {
          this.tokenData = JSON.stringify({bigId: this.user._id, token: res.token});
        });
    } else if (this.user.role === Role.Student) {
      this.http.get<UserVaccination[]>(`${environmentExample.endPoint}users/${this.user._id}/vaccinations`).toPromise()
        .then(res => {
          this.vaccines = res;
        });
    }
  }

  get isHealthcareProvider(): boolean {
    return this.authService.role === Role.HealthcareProvider;
  }

  async openLanguagePopover(ev) {
    const popover = await this.popoverCtrl.create({
      component: LanguagePopoverPage,
      event: ev
    });
    await popover.present();
  }

  toggleVaccines() {
    this.vaccinesOpen = !this.vaccinesOpen;
  }

  getLocale() {
    return this.languageService.selected;
  }

  formatVaccineType(type: VaccineType) {
    return formatVaccineType(type);
  }
}
