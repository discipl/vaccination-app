import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from './tabs.component';
import { MatButtonModule, MatIconModule, MatMenuModule, MatTabsModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [TabsComponent],
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    MatMenuModule,
    RouterModule
  ]
})
export class TabsModule { }
