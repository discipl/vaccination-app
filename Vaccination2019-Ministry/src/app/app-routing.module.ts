import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TabsComponent } from './tabs/tabs.component';
import { VaccinesComponent } from './vaccines/vaccines.component';
import { EventsComponent } from './events/events.component';
import { HcpManagerComponent } from './hcpManagers/hcpManager.component';
import { AuthGuardService } from './core/auth-guard.service';
import { VaccinationDetailsComponent } from './events/vaccinations/detail/vaccination.details.component';
import { VaccinesDetailsComponent } from './vaccines/vaccines.details/vaccines.details.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: '', component: TabsComponent, children: [
      { path: 'vaccines', children: [
          { path: '', component: VaccinesComponent, pathMatch: 'full' },
          { path: ':id', component: VaccinesDetailsComponent, pathMatch: 'full' },
          { path: '**', redirectTo: '' },
        ] },
      { path: 'vaccinations', children: [
          { path: '', component: EventsComponent, pathMatch: 'full' },
          { path: ':id', component: VaccinationDetailsComponent, pathMatch: 'full' },
          { path: '**', redirectTo: '' },
        ] },
      { path: 'hcpManagers', component: HcpManagerComponent, canActivate: [AuthGuardService] },
    ]
  },
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
