import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'toTime'
})
export class ToTimePipe implements PipeTransform {
    transform(value: number): string {
      return value? moment(value).format('HH:mm'):'';
    }


}
