import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'round'
})
export class RoundPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return value ? Math.round(value) : 0;
  }

}
