import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {V2DataComponent} from './v2-data/v2-data.component';
import {ApisModule} from '../adal/apis/apis.module';
import {AllInOneOutletComponent} from './all-in-one-outlet/all-in-one-outlet.component';
import {HttpClientModule} from '@angular/common/http';
import {MaterialAppModule} from '../aui/material/material-app.module';

const routes: Routes = [
  {
    path: 'all-in-one', component: AllInOneOutletComponent,
    children: [
      {path: '', redirectTo: 'data', pathMatch: 'full'},
      {path: 'data', component: V2DataComponent},
      {path: 'symbol/:symbol', component: V2DataComponent}
    ]
  }

];


@NgModule({
  // exports:[],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    MaterialAppModule,
    ApisModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    V2DataComponent,
    AllInOneOutletComponent
  ],
  providers: []

})
export class AllInOneModule {
}
