import { Component } from '@angular/core';
import {Router} from "@angular/router"
import {LanguagePopoverPage} from "../../pages/language-popover/language-popover.page";
import {PopoverController} from "@ionic/angular";

@Component({
  selector: 'app-profile',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {

  constructor(
    private router: Router,
    private popoverCtrl: PopoverController,
  ) {}

  async openLanguagePopover(ev) {
    const popover = await this.popoverCtrl.create({
      component: LanguagePopoverPage,
      event: ev
    });
    await popover.present();
  }

  showProfile() {
    this.router.navigate(['/tabs/settings/profile'])
  }

  showPrivacy() {
    this.router.navigate(['/tabs/settings/privacy'])
  }
}
