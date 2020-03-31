import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LanguagePopoverPageModule } from '../../pages/language-popover/language-popover.module';
import { LanguagePopoverPage } from '../../pages/language-popover/language-popover.page';
import { PrivacyComponent } from './privacy/privacy.component';
import { QRCodeModule } from "angular2-qrcode";

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{path: '', component: PrivacyComponent}]),
    TranslateModule,
    LanguagePopoverPageModule,
    QRCodeModule
  ],
  declarations: [PrivacyComponent],
  entryComponents: [LanguagePopoverPage]
})
export class PrivacyModule { }
