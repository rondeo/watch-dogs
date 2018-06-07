import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {McPercentComponent} from './mc-percent/mc-percent.component';
import {BubbleChartComponent} from './bubble-chart/bubble-chart.component';
import { LineGraphComponent } from './line-graph/line-graph.component';

@NgModule({
  exports: [
    McPercentComponent,
    BubbleChartComponent,
    LineGraphComponent
  ],
  imports: [
    CommonModule
  ],
  declarations: [
    McPercentComponent,
    BubbleChartComponent,
    LineGraphComponent
  ]
})
export class UiModule {
}
