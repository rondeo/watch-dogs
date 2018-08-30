import { Pipe, PipeTransform } from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';

@Pipe({
  name: 'toUs'
})
export class ToUsPipe implements PipeTransform {

  private MC
  constructor(
    private marketCap: ApiMarketCapService
  ){
    console.log('constarctor')
  }

  async transform(value: number, symbol: string): Promise<number> {
    if(!symbol) return;
    if(this.MC) return Promise.resolve(Math.round(this.MC[symbol].price_usd * value));
    this.MC = await this.marketCap.getTicker();
    return Math.round(this.MC[symbol].price_usd * value);
  }

}
