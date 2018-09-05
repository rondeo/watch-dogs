import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ValueColorDirective} from './value-color.directive';
import { CoinIconDirective } from './coin-icon.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    ValueColorDirective,
    CoinIconDirective
  ],
  declarations: [
   ValueColorDirective,
   CoinIconDirective
  ]
})
export class DirectivesModule { }
