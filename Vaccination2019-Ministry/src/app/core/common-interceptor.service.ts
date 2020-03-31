import { Injectable } from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { empty, Observable } from 'rxjs';
import { tap, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material';
import { LanguageService } from './language.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CommonInterceptor implements HttpInterceptor {
  DEFAULT_TIMEOUT = 60000; // 1 minute in milliseconds
  constructor(
    private router: Router,
    private toastr: ToastrService,
    private dialogRef: MatDialog,
    private languageService: LanguageService,
    private translate: TranslateService
    ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const clonedReq = req.clone({withCredentials: true, setHeaders: this.languageHeaders });
    const reqTimeout = Number(req.headers.get('timeout')) || this.DEFAULT_TIMEOUT;

    return next.handle(clonedReq).pipe(timeout(reqTimeout),
      tap(this.onSubscribeSuccess.bind(this), this.onSubscribeError.bind(this))
    );
  }

  private onSubscribeSuccess(res: HttpEvent<any>) {
  }

  private onSubscribeError(error: HttpEvent<any>): Observable<never> | undefined {
    if (error['name'] === 'TimeoutError') {
      this.toastr.error(error['message'], 'Error');
      return empty();
    }

    if (!(error instanceof HttpErrorResponse)) {
      return;
    }

    if (error.status === 401 || error.status === 402 || error.statusText === 'Unauthorized') {
      this.dialogRef.closeAll();
      this.toastr.error(this.translate.instant('Error.Unauthorized, try again sign in'), this.translate.instant('Error.Error'));
      this.router.navigate(['/login']);
      return;
    }

    if (error.status === 403) {
      this.toastr.error('Forbidden', 'Error');
      return;
    }

    if (error.status === 400) {
      // should be handled inside each request error handler
      return;
    }

    if (error.status === 500 || error.status === 502) {
      const message = error.error && error.error.message || this.translate.instant('Error.Something went wrong. Please, try later');
      this.toastr.error(message, 'Error');
      return;
    }

    this.toastr.error(error.error.message, 'Error');
    return;
  }

  get languageHeaders(): { [h: string]: string } {
    const headers = {};
    headers['accept-language'] = this.languageService.selected;
    return headers;
  }
}

export const
  CommonInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: CommonInterceptor,
    multi: true
  };
