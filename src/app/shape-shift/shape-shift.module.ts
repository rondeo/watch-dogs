import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SSCoinsAvailableComponent } from './ss-coins-available/ss-coins-available.component';
import { SsMainComponent } from './ss-main/ss-main.component';
import {ShapeShiftService} from './shape-shift.service';
import {FormsModule} from '@angular/forms';
import {UiModule} from '../aui/comps/ui.module';
import {MaterialAppModule} from '../aui/material/material-app.module';

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
