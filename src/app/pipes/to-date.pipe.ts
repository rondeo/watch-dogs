import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'toDate'
})
export class ToDatePipe implements PipeTransform {

  transform(value: number): string {
   return value? moment(value).format('MM-DD HH:mm'):'';
  }

}
