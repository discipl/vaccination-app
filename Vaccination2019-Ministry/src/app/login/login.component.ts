import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginRequest, MinistryLogin, HcpManagerLogin } from '../models/login';
import { LoaderService } from '../core/loader.service';
import { Role } from '../models/user';
import { MatButtonToggleChange } from '@angular/material';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {

  request: LoginRequest;
  role = `${Role.MINISTRY}`;
  loginForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastrService,
    private formBuilder: FormBuilder,
    private loaderService: LoaderService
  ) {
    this.loginForm = this.formBuilder.group({
      HCPManagerNumber: [''],
      password: ['', [Validators.required]],
    });
  }

  login() {
    this.fillRequest();
    this.loaderService.increase();
    this.authService.login(this.request)
      .then(() => {
        this.loaderService.decrease();
        this.router.navigate(['/']);
      })
      .catch(err => {
        this.loaderService.decrease();
        if (err.status === 400) {
          if (err.error.fields) {
            err.error.fields.forEach(field => {
              this.loginForm.controls[field.param].setErrors({msg: field.message});
            });
          } else {
            this.toastService.error(err.error.message);
          }
        }
      });
  }

  setRole(role) {
    this.role = role;
  }

  fillRequest() {
    if (this.role === `${Role.MINISTRY}`) {
      this.request = new MinistryLogin(this.loginForm.value);
    } else if (this.role === `${Role.HCP_MANAGER}`) {
      this.request = new HcpManagerLogin(this.loginForm.value);
    }
  }
}
