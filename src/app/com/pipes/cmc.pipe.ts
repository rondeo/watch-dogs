import { Pipe, PipeTransform } from '@angular/core';
import {ApiMarketCapService} from '../../core/apis/api-market-cap.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


@Pipe({
  name: 'cmc'
})
export class CmcPipe implements PipeTransform {

  private MC;
  constructor(
    private marketCap: ApiMarketCapService
  ) {
   //  console.log('constarctor')
  }

   transform(prop: string, symbol: string): Observable<number> {
    if (!prop) return null;
    return this.marketCap.ticker$().pipe(map(MC => {
      return MC[symbol] ? MC[symbol][prop] : null;
    }));

  }

}
