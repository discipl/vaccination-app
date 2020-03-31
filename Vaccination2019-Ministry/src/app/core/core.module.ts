import { NgModule } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonInterceptorProvider } from './common-interceptor.service';
import { LanguageService } from './language.service';
import { LoaderService } from './loader.service';

@NgModule({
  imports: [
    HttpClientModule,
  ],
  providers: [
    AuthService,
    CommonInterceptorProvider,
    LanguageService,
    LoaderService,
  ],
})
export class CoreModule {

}
