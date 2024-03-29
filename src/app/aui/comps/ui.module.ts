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
import { RsiIndicatorComponent } from './rsi-indicator/rsi-indicator.component';
import { IndicatorComponent } from './indicator/indicator.component';
import { MacdIndicatorComponent } from './macd-indicator/macd-indicator.component';
import { StochComponent } from './stoch/stoch.component';
import { VolumeHistComponent } from './volume-hist/volume-hist.component';
import { FishesComponent } from './fishes/fishes.component';
import { StochRsiComponent } from './stoch-rsi/stoch-rsi.component';
import {MaterialAppModule} from '../material/material-app.module';
import { TablePropsComponent } from './table-props/table-props.component';
import { MfiIndicatorComponent } from './mfi-indicator/mfi-indicator.component';
import { VwmacdIndicatorComponent } from './vwmacd-indicator/vwmacd-indicator.component';
import { CandlesVolumesComponent } from './candles-volumes/candles-volumes.component';



@NgModule({
  exports: [
    McPercentComponent,
    BubbleChartComponent,
    LineGraphComponent,
    SortableTableComponent,
    LineChartComponent,
    CrossTableComponent,
    McDataComponent,
    CandlesticksComponent,
    RsiIndicatorComponent,
    IndicatorComponent,
    MacdIndicatorComponent,
    StochComponent,
    VolumeHistComponent,
    FishesComponent,
    StochRsiComponent,
    TablePropsComponent,
    MfiIndicatorComponent,
    VwmacdIndicatorComponent,
    CandlesVolumesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DirectivesModule,
    PipesModule,
    MaterialAppModule
  ],
  declarations: [
    McPercentComponent,
    BubbleChartComponent,
    LineGraphComponent,
    SortableTableComponent,
    LineChartComponent,
    CrossTableComponent,
    McDataComponent,
    CandlesticksComponent,
    RsiIndicatorComponent,
    IndicatorComponent,
    MacdIndicatorComponent,
    StochComponent,
    VolumeHistComponent,
    FishesComponent,
    StochRsiComponent,
    TablePropsComponent,
    MfiIndicatorComponent,
    VwmacdIndicatorComponent,
    CandlesVolumesComponent
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class UiModule {
}
