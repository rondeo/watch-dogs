import {Pipe, PipeTransform} from '@angular/core';
import {ApiMarketCapService} from '../../core/apis/api-market-cap.service';
import {VOMCObj} from '../../models/api-models';

@Pipe({
  name: 'coin2us3'
})
export class Coin2us3Pipe implements PipeTransform {

  constructor(
    private marketCap: ApiMarketCapService
  ) {
  }

  async transform(value: number, symbol: string): Promise<number> {
    if (!symbol) return;
    if (symbol === 'USDT' || symbol === 'USD') return Promise.resolve(+value.toFixed(2));
    const MC = await this.marketCap.getTicker();
    if(MC[symbol])  return +(MC[symbol].price_usd * value).toPrecision(3);
    return 0;
  }

}
