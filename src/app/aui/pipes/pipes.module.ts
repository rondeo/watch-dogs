import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Coin2usPipe } from './coin2us.pipe';
import {ApisModule} from '../../a-core/apis/apis.module';
import { Coin2us3Pipe } from './coin2us3.pipe';
import { ToDatePipe } from './to-date.pipe';
import { CmcPipe } from './cmc.pipe';
import { MyDisplNumPipe } from './my-displ-num.pipe';
import { CmcMarketPipe } from './cmc-market.pipe';
import { ToTimePipe } from './to-time.pipe';
import { MyUsPipe } from './my-us.pipe';
import { RoundPipe } from './round.pipe';

@NgModule({
  imports: [
    CommonModule,
    ApisModule
  ],
  exports:[
    Coin2usPipe,
    Coin2us3Pipe,
    ToDatePipe,
    ToTimePipe,
    CmcPipe,
    MyDisplNumPipe,
    CmcMarketPipe,
    MyUsPipe,
    RoundPipe
  ],
  declarations: [
    Coin2usPipe,
    Coin2us3Pipe,
    ToDatePipe,
    CmcPipe,
    MyDisplNumPipe,
    CmcMarketPipe,
    ToTimePipe,
    MyUsPipe,
    RoundPipe
  ]
})
export class PipesModule { }
