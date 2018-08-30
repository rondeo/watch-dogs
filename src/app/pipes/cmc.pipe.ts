import { Pipe, PipeTransform } from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';

@Pipe({
  name: 'cmc'
})
export class CmcPipe implements PipeTransform {

  private MC;
  constructor(
    private marketCap: ApiMarketCapService
  ){
    console.log('constarctor')
  }

  async transform(prop: string, symbol:string): Promise<number> {

    if(!prop) return null;
    if (this.MC) return Promise.resolve(this.MC[symbol][prop]);
    this.MC = await this.marketCap.getTicker();
    return this.MC[symbol][prop];
  }

}
