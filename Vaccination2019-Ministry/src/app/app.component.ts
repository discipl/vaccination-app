import { Component } from '@angular/core';
import { LanguageService } from './core/language.service';
import { LoaderService } from './core/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(
    private languageService: LanguageService,
    public loaderService: LoaderService
  ) {
    this.languageService.setInitialAppLanguage();
  }
}
