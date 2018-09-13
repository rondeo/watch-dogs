import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {McPercentComponent} from './mc-percent/mc-percent.component';
import {BubbleChartComponent} from './bubble-chart/bubble-chart.component';
import { LineGraphComponent } from './line-graph/line-graph.component';
import {SortableTableComponent} from './sortable-table/sortable-table.component';
import {LineChartComponent} from './line-chart/line-chart.component';
import {CrossTableComponent} from './cross-table/cross-table.component';
import {FormsModule} from '@angular/forms';
import { McDataComponent } from './mc-data/mc-data.component';
import {DirectivesModule} from '../directives/directives.module';
import {PipesModule} from '../pipes/pipes.module';
import { CandlesticksComponent } from './candlesticks/candlesticks.component';

@NgModule({
  exports: [
    McPercentComponent,
    BubbleChartComponent,
    LineGraphComponent,
    SortableTableComponent,
    LineChartComponent,
    CrossTableComponent,
    McDataComponent,
    CandlesticksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DirectivesModule,
    PipesModule
  ],
  declarations: [
    McPercentComponent,
    BubbleChartComponent,
    LineGraphComponent,
    SortableTableComponent,
    LineChartComponent,
    CrossTableComponent,
    McDataComponent,
    CandlesticksComponent
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class UiModule {
}
