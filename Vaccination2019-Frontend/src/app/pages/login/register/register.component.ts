import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from 'src/app/core/toast.service';
import { LoaderService } from 'src/app/core/loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RegisterService } from './register.service';
import { User, Role } from 'src/models/user-model';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  fieldName = '';
  role: Role;

  constructor(
      private toastService: ToastService,
      private loading: LoaderService,
      private router: Router,
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private registerService: RegisterService,
      private route: ActivatedRoute) {
    this.role = this.route.snapshot.params['role'];
    this.formInit();
  }

  get isHealthcareProvider(): boolean {
    return this.role === Role.HealthcareProvider;
  }

  formInit() {
    this.fieldName = this.isHealthcareProvider ? 'bigId' : 'duoId';

    this.registerForm = this.formBuilder.group({
      [this.fieldName]: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  register() {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        if (this.registerForm.controls[key].invalid) {
          this.registerForm.controls[key].markAsDirty({ onlySelf: true });
        }
      });
      return;
    }
    this.loading.present();
    const request = this.isHealthcareProvider ? this.registerService.addHealthcareProvider(this.registerForm.value) : this.registerService.addStudent(this.registerForm.value);
    request
        .pipe(
            finalize(() => this.loading.dismiss())
        )
        .subscribe(
            res => this.goToDetailScreen(res),
            (res: HttpErrorResponse) => this.handleError(res)
        );
  }

  handleError(res: HttpErrorResponse) {
    if (res.status === 400) {
      res.error.fields.forEach(field => {
        const control = this.registerForm.controls[field.param];
        control.setErrors({[field.type.toLowerCase()]: true});
        control.markAsDirty({ onlySelf: true });
      });
    } else {
      this.toastService.presentToast(res.error.message)
    }
  }

  goToDetailScreen(response: User) {
    this.authService.user = response;
    this.router.navigate(['/tabs']);
  }
}

