import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { defaultLanguage } from '../pages/language-popover/language.constants';

const LNG_KEY = 'SELECTED_LANGUAGE';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  selected = '';

  constructor(private translate: TranslateService) { }

  setInitialAppLanguage() {
    this.translate.setDefaultLang(defaultLanguage);
    localStorage.setItem(LNG_KEY, defaultLanguage);

    const value = localStorage.getItem(LNG_KEY);

    if (value) {
      this.setLanguage(value);
      this.selected = value;
    }
  }

  setLanguage(lng) {
    this.translate.use(lng);
    this.selected = lng;
    localStorage.setItem(LNG_KEY, lng)
  }
}
