import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ValueColorDirective} from './value-color.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    ValueColorDirective
  ],
  declarations: [

   ValueColorDirective
  ]
})
export class DirectivesModule { }
