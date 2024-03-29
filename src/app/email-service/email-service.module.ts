import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WatchDogService} from './watch-dog.service';
import { CreateWatchdogComponent } from './create-watchdog/create-watchdog.component';
import { RunWatchdogsComponent } from './run-watchdogs/run-watchdogs.component';
import { EmailMainComponent } from './email-main/email-main.component';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {EmailServiceService} from './email-service.service';
import { EditScriptComponent } from './edit-script/edit-script.component';
import { WatchdogsListComponent } from './watchdogs-list/watchdogs-list.component';
import { WatchdogEditComponent } from './watchdog-edit/watchdog-edit.component';
import { AddScriptComponent } from './add-script/add-script.component';
import {AppServicesModule} from '../a-core/app-services/app-services.module';
import { WatchdogTestComponent } from './watchdog-test/watchdog-test.component';
import {UiModule} from '../aui/comps/ui.module';
import {MaterialAppModule} from '../aui/material/material-app.module';
import {WidgetsModule} from '../aui/widgets/widgets.module';



const routes: Routes = [
  {
    path: 'email-service', component: EmailMainComponent,
    children: [
      { path: '', redirectTo: 'watchdogs-list/SELL', pathMatch: 'full'},
      { path: 'watchdogs', redirectTo: 'watchdogs-list/SELL', pathMatch: 'full'},
      { path: 'watchdogs-list/:orderType', component: WatchdogsListComponent},
      { path: 'create-bot/:exchange/:base/:coin', component: CreateWatchdogComponent},
      { path: 'watchdog-edit/:uid', component: WatchdogEditComponent},
      { path: 'watchdog-test/:uid', component: WatchdogTestComponent},
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
    AppServicesModule,
    WidgetsModule,
    UiModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    CreateWatchdogComponent,
    RunWatchdogsComponent,
    EmailMainComponent,
    EditScriptComponent,
    WatchdogsListComponent,
    WatchdogEditComponent,
    AddScriptComponent,
    WatchdogTestComponent
  ],
  providers: [
    WatchDogService,
    EmailServiceService
  ]

})
export class EmailServiceModule { }
