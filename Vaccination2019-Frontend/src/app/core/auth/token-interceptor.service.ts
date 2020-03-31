import { Injectable } from '@angular/core';
import {
    HTTP_INTERCEPTORS,
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
    HttpResponseBase
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/toast.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import {LoaderService} from "../loader.service";
import {LanguageService} from "../language.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    token: string;
    TOKEN_HEADER = 'token';

    constructor(
        private toastService: ToastService,
        private translateService: TranslateService,
        private authService: AuthService,
        private router: Router,
        private loading: LoaderService,
        private languageService: LanguageService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const clonedReq = req.clone({ setHeaders: this.authHeaders });

        return next.handle(clonedReq).pipe(
            tap(this.onSubscribeSuccess.bind(this), this.onSubscribeError.bind(this))
        );
    }

    private onSubscribeSuccess(res: HttpEvent<any>) {
        if (res instanceof HttpResponse) {
            this.updateTokenFromResponse(res);
        }
    }

    private onSubscribeError(error: HttpEvent<any>) {
        if (!(error instanceof HttpErrorResponse)) {
            return;
        }
        const handlerName = 'handleError' + error.status;

        if (typeof this[handlerName] === 'function') {
            return this[handlerName](error);
        }
        this.defaultErrorHandler(error);
    }

    defaultErrorHandler(error: HttpErrorResponse) {
        const errorMessage = this.errorMessage(error);
        if (errorMessage) {
            this.toastService.presentToast(errorMessage);
        }
        this.loading.dismiss();
    }

    handleError401(error: HttpErrorResponse) {
        this.defaultErrorHandler(error);
        this.authService.logout();
        this.router.navigate(['']);
    }

    updateTokenFromResponse(res: HttpResponseBase) {
        const headerName = this.TOKEN_HEADER;

        if (res.headers && res.headers.has(headerName)) {
            this.token = res.headers.get(headerName);
            localStorage.setItem('token', this.token);
        }
    }

    get authHeaders(): { [h: string]: string } {
        const headers = {};
        headers['accept-language'] = this.languageService.selected;
        this.token = localStorage.getItem('token');
        if (this.token) {
          headers[this.TOKEN_HEADER] = this.token;
        }
        return headers;
    }

    errorMessage(error: HttpErrorResponse): string {
        return error.error.message || this.statusErrorMessage(error.status);
    }

    statusErrorMessage(status: number): string {
        const key = `errors.${status}`;
        const errorMessage = this.translateService.instant(key);
        return errorMessage === key ? '' : errorMessage;
    }
}

export const tokenInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi: true
};
