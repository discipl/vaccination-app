import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguagePopoverPageModule } from '../pages/language-popover/language-popover.module';
import { LanguagePopoverPage } from '../pages/language-popover/language-popover.page';
import { SettingsComponent } from './settings/settings.component';
import { QRCodeModule } from "angular2-qrcode";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: SettingsComponent}]),
    TranslateModule,
    LanguagePopoverPageModule,
    QRCodeModule
  ],
  declarations: [SettingsComponent],
  entryComponents: [LanguagePopoverPage]
})
export class SettingsModule { }
