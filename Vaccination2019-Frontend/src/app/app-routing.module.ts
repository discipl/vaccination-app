import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth-guard.service';

const routes: Routes = [
  { path: '', loadChildren: './pages/choose-role/choose-role.module#ChooseRolePageModule' },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule'},
  { path: 'tabs', loadChildren: './tabs/tabs.module#TabsPageModule', canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/tabs' },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
