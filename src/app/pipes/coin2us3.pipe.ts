import {Pipe, PipeTransform} from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {VOMCObj} from '../models/api-models';

@Pipe({
  name: 'coin2us3'
})
export class Coin2us3Pipe implements PipeTransform {
  private MC: VOMCObj;

  constructor(
    private marketCap: ApiMarketCapService
  ) {
  }

  async transform(value: number, symbol: string): Promise<number> {
    if (!symbol) return;
    if (this.MC) return Promise.resolve(Math.round(1000 * (this.MC[symbol].price_usd * value)) / 1000);
    this.MC = await this.marketCap.getTicker();
    const out = this.MC[symbol].price_usd * value;
    return +out.toPrecision(3);
  }

}
