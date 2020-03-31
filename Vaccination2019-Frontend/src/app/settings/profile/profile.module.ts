import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguagePopoverPageModule } from '../../pages/language-popover/language-popover.module';
import { LanguagePopoverPage } from '../../pages/language-popover/language-popover.page';
import { ProfileComponent } from './profile/profile.component';
import { QRCodeModule } from "angular2-qrcode";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: ProfileComponent}]),
    TranslateModule,
    LanguagePopoverPageModule,
    QRCodeModule
  ],
  declarations: [ProfileComponent],
  entryComponents: [LanguagePopoverPage]
})
export class ProfileModule { }
