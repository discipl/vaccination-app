import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { CoreModule } from './core/core.module';
import { AuthService } from './core/auth.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatToolbarModule,
  MatGridListModule,
  MatMenuModule,
  MatTableModule,
  MatPaginatorModule,
  MatDialogModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatAutocompleteModule,
  MatSelectModule,
  MatStepperModule, DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatButtonToggleModule
} from '@angular/material';
import {MomentDateAdapter} from '@angular/material-moment-adapter';
import { LayoutModule } from '@angular/cdk/layout';
import { TabsModule } from './tabs/tabs.module';
import { VaccinationsComponent } from './events/vaccinations/vaccinations.component';
import { VaccinesComponent } from './vaccines/vaccines.component';
import { NewVaccineComponent } from './vaccines/new/vaccines.new.component';
import { NgxLoadingModule } from 'ngx-loading';
import { NewEventComponent } from './events/new/event.new.component';
import { EventsComponent } from './events/events.component';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { AgmCoreModule } from '@agm/core';
import { MY_DATE_FORMATS } from './core/formats';
import { HcpManagerComponent } from './hcpManagers/hcpManager.component';
import { NewHcpManagerComponent } from './hcpManagers/new/hcpManager.new.component';
import { VaccinationDetailsComponent } from './events/vaccinations/detail/vaccination.details.component';
import { VaccinesDetailsComponent } from './vaccines/vaccines.details/vaccines.details.component';
import { ChartsModule } from 'ng2-charts';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function startupServiceFactory(authService: AuthService): Function {
  return () => authService.initSession();
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    VaccinesComponent,
    VaccinationsComponent,
    NewVaccineComponent,
    NewEventComponent,
    EventsComponent,
    EventsComponent,
    HcpManagerComponent,
    NewHcpManagerComponent,
    VaccinationDetailsComponent,
    VaccinesDetailsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    FormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatGridListModule,
    MatMenuModule,
    LayoutModule,
    TabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    NgxLoadingModule.forRoot({}),
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatStepperModule,
    MatButtonToggleModule,
    GooglePlaceModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyDvjyjo7hHgfEQXwG55I8vVJeN8IKx5gm4'
    }),
    ChartsModule
  ],
  providers: [
    {
      // Provider for APP_INITIALIZER
      provide: APP_INITIALIZER,
      useFactory: startupServiceFactory,
      deps: [AuthService],
      multi: true
    },
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS},
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    NewVaccineComponent,
    NewEventComponent,
    NewHcpManagerComponent,
  ]
})

export class AppModule {
}
