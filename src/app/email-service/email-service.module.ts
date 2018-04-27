import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WatchDogService} from './watch-dog.service';

import { CreateWatchdogComponent } from './create-watchdog/create-watchdog.component';

import { RunWatchdogsComponent } from './run-watchdogs/run-watchdogs.component';
import { EmailMainComponent } from './email-main/email-main.component';
import { EmailAllCoinsComponent } from './email-all-coins/email-all-coins.component';
import { EmailSelectedCoinsComponent } from './email-selected-coins/email-selected-coins.component';
import {RouterModule, Routes} from '@angular/router';
import {MaterialAppModule} from '../material/material-app.module';
import {FormsModule} from '@angular/forms';
import {EmailServiceService} from './email-service.service';
import { EditScriptComponent } from './edit-script/edit-script.component';
import {SharedModule} from '../shared/shared.module';
import { WatchdogsListComponent } from './watchdogs-list/watchdogs-list.component';
import { WatchdogEditComponent } from './watchdog-edit/watchdog-edit.component';
import { AddScriptComponent } from './add-script/add-script.component';



const routes: Routes = [
  {
    path: 'email-service', component: EmailMainComponent,
    children:[
      { path: '', redirectTo:'watchdogs', pathMatch:'full'},
      { path: 'selected-coins', component: EmailSelectedCoinsComponent},
      { path: 'watchdogs', component:WatchdogsListComponent},
      { path: 'watchdog-edit/:uid', component: WatchdogEditComponent},
      { path: 'edit-script/:uid', component: EditScriptComponent},
      { path: 'run-watchdogs', component: RunWatchdogsComponent}
    ]
  }
];


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MaterialAppModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    CreateWatchdogComponent,
    RunWatchdogsComponent,
    EmailMainComponent,
    EmailAllCoinsComponent,
    EmailSelectedCoinsComponent,
    EditScriptComponent,
    WatchdogsListComponent,
    WatchdogEditComponent,
    AddScriptComponent
  ],
  providers:[
    WatchDogService,
    EmailServiceService
  ]

})
export class EmailServiceModule { }
