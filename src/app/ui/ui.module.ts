import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McPercentComponent } from './mc-percent/mc-percent.component';

@NgModule({
  exports:[
   McPercentComponent
  ],
  imports: [
    CommonModule
  ],
  declarations: [
    McPercentComponent
  ]
})
export class UiModule { }
