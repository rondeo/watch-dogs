import {Pipe, PipeTransform} from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {VOMCObj} from '../models/api-models';

@Pipe({
  name: 'toUs3'
})
export class ToUs3Pipe implements PipeTransform {
  private MC: VOMCObj

  constructor(
    private marketCap: ApiMarketCapService
  ) {
  }

  async transform(value: number, symbol: string): Promise<number> {
    if (!symbol) return;
    if (this.MC) return Promise.resolve(Math.round(1000 * (this.MC[symbol].price_usd * value)) / 1000);
    this.MC = await this.marketCap.getTicker();
    return Math.round(1000 * this.MC[symbol].price_usd * value) / 1000;
  }

}
