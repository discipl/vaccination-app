import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { defaultLanguage } from './language.constants';

const LNG_KEY = 'SELECTED_LANGUAGE';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  selected = '';

  constructor(private translate: TranslateService) { }

  setInitialAppLanguage() {
    let value = localStorage.getItem(LNG_KEY);
    if (!value) {
      value = defaultLanguage;
    }
    this.setLanguage(value);
  }

  setLanguage(lng) {
    this.translate.use(lng);
    this.selected = lng;
    localStorage.setItem(LNG_KEY, lng);
  }
}
