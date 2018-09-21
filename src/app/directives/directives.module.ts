import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ValueColorDirective} from './value-color.directive';
import { CoinIconDirective } from './coin-icon.directive';
import { SaveValueDirective } from './save-value.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    ValueColorDirective,
    CoinIconDirective,
    SaveValueDirective
  ],
  declarations: [
   ValueColorDirective,
   CoinIconDirective,
   SaveValueDirective
  ]
})
export class DirectivesModule { }
