import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'myDisplNum'
})
export class MyDisplNumPipe implements PipeTransform {

  transform(value: number): string {
    return isNaN(value) ? '' : Math.round(value *= 1e8).toString().substr(0, 4);
  }

}
