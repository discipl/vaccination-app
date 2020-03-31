import { PopoverController } from '@ionic/angular';
import { LanguageService } from '../../core/language.service';
import { Component, OnInit } from '@angular/core';
import { availableLanguages } from './language.constants';

@Component({
  selector: 'app-language-popover',
  templateUrl: './language-popover.page.html',
  styleUrls: ['./language-popover.page.scss'],
})
export class LanguagePopoverPage implements OnInit {
  languages = availableLanguages;
  selected = '';

  constructor(private languageService: LanguageService, private popoverCtrl: PopoverController) { }

  ngOnInit() {
    this.selected = this.languageService.selected;
  }

  select(lng) {
    this.languageService.setLanguage(lng);
    this.popoverCtrl.dismiss();
  }
}
