import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SSCoinsAvailableComponent } from './ss-coins-available/ss-coins-available.component';
import { SsMainComponent } from './ss-main/ss-main.component';
import {ShapeShiftService} from './shape-shift.service';

import {FormsModule} from '@angular/forms';
import {MaterialAppModule} from '../com/material/material-app.module';
import {UiModule} from '../com/ui/ui.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialAppModule,
    UiModule
  ],
  declarations: [SSCoinsAvailableComponent, SsMainComponent],
  providers:[ShapeShiftService]
})
export class ShapeShiftModule { }
