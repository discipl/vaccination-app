import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'events',
        children: [
          {
            path: '',
            loadChildren: '../events/events.module#EventsModule'
          }
        ]
      },
      {
        path: 'appointments',
        children: [
          {
            path: '',
            loadChildren: '../appointments/appointments.module#AppointmentsModule'
          }
        ]
      },
      {
        path: 'settings',
        children: [
          {
            path: '',
            loadChildren: '../settings/settings.module#SettingsModule'
          },
          {
            path: 'profile',
            loadChildren: '../settings/profile/profile.module#ProfileModule'
          },
          {
            path: 'privacy',
            loadChildren: '../settings/privacy/privacy.module#PrivacyModule'
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/events',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TabsPageRoutingModule { }
