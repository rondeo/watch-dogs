import { Pipe, PipeTransform } from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';

@Pipe({
  name: 'coin2us'
})
export class Coin2usPipe implements PipeTransform {

  private MC
  constructor(
    private marketCap: ApiMarketCapService
  ){
  }

  async transform(value: number, symbol: string): Promise<number> {
    if(!symbol) return;
    if(symbol === 'USDT')return Promise.resolve(+value.toFixed(2));
    if(this.MC) return Promise.resolve(Math.round(this.MC[symbol].price_usd * value));
    this.MC = await this.marketCap.getTicker();
    return Math.round(this.MC[symbol].price_usd * value);
  }

}
