import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WatchDogService} from './watch-dog.service';
import { CreateWatchdogComponent } from './create-watchdog/create-watchdog.component';
import { RunWatchdogsComponent } from './run-watchdogs/run-watchdogs.component';
import { EmailMainComponent } from './email-main/email-main.component';
import {RouterModule, Routes} from '@angular/router';
import {MaterialAppModule} from '../material/material-app.module';
import {FormsModule} from '@angular/forms';
import {EmailServiceService} from './email-service.service';
import { EditScriptComponent } from './edit-script/edit-script.component';

import { WatchdogsListComponent } from './watchdogs-list/watchdogs-list.component';
import { WatchdogEditComponent } from './watchdog-edit/watchdog-edit.component';
import { AddScriptComponent } from './add-script/add-script.component';
import {AppServicesModule} from '../app-services/app-services.module';
import { WatchdogTestComponent } from './watchdog-test/watchdog-test.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {UiModule} from '../ui/ui.module';



const routes: Routes = [
  {
    path: 'email-service', component: EmailMainComponent,
    children:[
      { path: '', redirectTo:'watchdogs', pathMatch:'full'},
      { path: 'watchdogs', redirectTo:'watchdogs/SELL', pathMatch:'full'},
      { path: 'watchdogs/:action', component:WatchdogsListComponent},
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
  providers:[
    WatchDogService,
    EmailServiceService
  ]

})
export class EmailServiceModule { }
