import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth-guard.service';
import { tokenInterceptorProvider } from './auth/token-interceptor.service';
import { LanguageService } from './language.service';
import { ToastService } from './toast.service';
import { LoaderService } from './loader.service';

@NgModule({
    imports: [
        HttpClientModule,
    ],
    exports: [ ],
    providers: [
        AuthService,
        AuthGuard,
        tokenInterceptorProvider,
        LanguageService,
        ToastService,
        LoaderService
    ]
})
export class CoreModule {
}
