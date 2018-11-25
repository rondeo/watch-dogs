import { Pipe, PipeTransform } from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {map} from 'rxjs/operator/map';
import {Observable} from 'rxjs/Observable';

@Pipe({
  name: 'cmc'
})
export class CmcPipe implements PipeTransform {

  private MC;
  constructor(
    private marketCap: ApiMarketCapService
  ){
   //  console.log('constarctor')
  }

   transform(prop: string, symbol:string): Observable<number> {
    if(!prop) return null;
    return this.marketCap.ticker$().map(MC=> {
      return MC[symbol]?MC[symbol][prop]:null;
    });

  }

}
