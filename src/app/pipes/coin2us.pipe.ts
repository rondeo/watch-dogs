import { Pipe, PipeTransform } from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';

@Pipe({
  name: 'coin2us'
})
export class Coin2usPipe implements PipeTransform {


  constructor(
    private marketCap: ApiMarketCapService
  ) {

  }

  async transform(value: number, symbol: string): Promise<number> {
    if (!symbol) return;
    if (symbol === 'USDT' || symbol === 'USD') return Promise.resolve(+value.toFixed(2));

    const MC = await this.marketCap.getTicker();
    if(MC[symbol])  return Math.round(MC[symbol].price_usd * value);
   return 0;
  }

}
