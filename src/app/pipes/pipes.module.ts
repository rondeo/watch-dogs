import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToUsPipe } from './to-us.pipe';
import {ApisModule} from '../apis/apis.module';
import { ToUs3Pipe } from './to-us3.pipe';
import { ToDatePipe } from './to-date.pipe';
import { CmcPipe } from './cmc.pipe';
import { MyDisplNumPipe } from './my-displ-num.pipe';
import { RedditPipe } from './reddit.pipe';

@NgModule({
  imports: [
    CommonModule,
    ApisModule
  ],
  exports:[
    ToUsPipe,
    ToUs3Pipe,
    ToDatePipe,
    CmcPipe,
    MyDisplNumPipe
  ],
  declarations: [
    ToUsPipe,
    ToUs3Pipe,
    ToDatePipe,
    CmcPipe,
    MyDisplNumPipe,
    RedditPipe
  ]
})
export class PipesModule { }
