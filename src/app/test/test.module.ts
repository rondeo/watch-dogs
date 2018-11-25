import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TestCandlesService} from './test-candles.service';

@NgModule({
  exports: [
  ],
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    TestCandlesService
  ]
})
export class TestModule { }
