import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SSCoinsAvailableComponent } from './ss-coins-available/ss-coins-available.component';
import { SsMainComponent } from './ss-main/ss-main.component';
import {ShapeShiftService} from './shape-shift.service';
import {SharedModule} from '../shared/shared.module';
import {FormsModule} from '@angular/forms';
import {MaterialAppModule} from '../material/material-app.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    MaterialAppModule
  ],
  declarations: [SSCoinsAvailableComponent, SsMainComponent],
  providers:[ShapeShiftService]
})
export class ShapeShiftModule { }
