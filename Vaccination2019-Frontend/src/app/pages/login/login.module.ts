import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoginPage } from './login.page';
import { TranslateModule } from '@ngx-translate/core';
import { LoginRoutingModule } from './login-routing.module';
import { LoginService } from './login.service';
import { RegisterComponent } from './register/register.component';
import { RegisterService } from './register/register.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginRoutingModule,
    TranslateModule,
    ReactiveFormsModule
  ],
  declarations: [
    LoginPage,
    RegisterComponent
  ],
  providers: [
    LoginService,
    RegisterService
  ]
})
export class LoginPageModule { }
