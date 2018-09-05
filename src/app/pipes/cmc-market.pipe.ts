import {Pipe, PipeTransform} from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';

@Pipe({
  name: 'cmcMarket'
})
export class CmcMarketPipe implements PipeTransform {

  static data = {};
  private MC;

  constructor(
    private marketCap: ApiMarketCapService
  ) {

  }

  async transform(market: string): Promise<string> {
    if (CmcMarketPipe.data[market]) Promise.resolve(CmcMarketPipe.data[market]);
    const ar = market.split('_');
    const MC = await this.marketCap.getTicker();
    const coin = MC[ar[1]].price_usd;
    const base = MC[ar[0]].price_usd;
    const res = (coin / base).toFixed(8) + ' $' + coin.toFixed(3);
    CmcMarketPipe.data[market] = res;
    return res;


  }

}
