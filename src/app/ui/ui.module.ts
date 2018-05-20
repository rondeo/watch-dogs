import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {McPercentComponent} from './mc-percent/mc-percent.component';
import {BubbleChartComponent} from './bubble-chart/bubble-chart.component';

@NgModule({
  exports: [
    McPercentComponent,
    BubbleChartComponent
  ],
  imports: [
    CommonModule
  ],
  declarations: [
    McPercentComponent,
    BubbleChartComponent
  ]
})
export class UiModule {
}
