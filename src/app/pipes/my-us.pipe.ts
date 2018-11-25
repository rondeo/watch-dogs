import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myUs'
})
export class MyUsPipe implements PipeTransform {

  transform(value: number): string {
    if (isNaN(value)) return '';
    let dec = 2;
    if (value > 1000) dec = 0;
    else if (value < 1) dec = 3;
    return value.toFixed(dec);
  }

}
