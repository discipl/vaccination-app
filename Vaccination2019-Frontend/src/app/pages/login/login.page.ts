import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from 'src/app/core/toast.service';
import { LoaderService } from 'src/app/core/loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { LoginService } from './login.service';
import { User, Role } from 'src/models/user-model';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage {
    myForm: FormGroup;
    fieldName = '';
    role: Role;

    constructor(
        private toastService: ToastService,
        private loading: LoaderService,
        private router: Router,
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private loginService: LoginService,
        private translateService: TranslateService,
        private route: ActivatedRoute) {
        this.role = this.route.snapshot.params['role'];
        this.formInit();    }

    ionViewDidLeave() {
        this.myForm.reset();
    }

    get isHealthcareProvider(): boolean {
        return this.role === Role.HealthcareProvider;
    }

    formInit() {
        this.fieldName = this.isHealthcareProvider ? 'bigId' : 'duoId';

        this.myForm = this.formBuilder.group({
            [this.fieldName]: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    login() {
        if (this.myForm.invalid) {
            Object.keys(this.myForm.controls).forEach(key => {
                if (this.myForm.controls[key].invalid) {
                    this.myForm.controls[key].markAsDirty({ onlySelf: true });
                }
            });
            return;
        }
        this.loading.present();
        const request = this.isHealthcareProvider ? this.loginService.loginHealthcareProvider(this.myForm.value) : this.loginService.loginStudent(this.myForm.value);
        request
            .pipe(
                finalize(() => this.loading.dismiss())
            )
            .subscribe(
                res => this.goToDetailScreen(res),
                () => this.toastService.presentToast(this.translateService.instant('Login.error'))
            );
    }

    goToDetailScreen(response: User) {
        this.authService.user = response;
        this.router.navigate(['/tabs']);
    }
}
