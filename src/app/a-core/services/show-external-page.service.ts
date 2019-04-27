import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ApisPublicService} from '../apis/api-public/apis-public.service';

@Injectable()
export class ShowExternalPageService {


  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {

  }

  showMarket(exchange: string, baseOrMarket: string, coin?: string) {
    if (coin) baseOrMarket += '_' + coin;
    const ar = baseOrMarket.split('_');
    const url = this.apisPublic.getExchangeApi(exchange).getMarketUrl(ar[0], ar[1]);
    if (url) window.open(url, exchange);
    else console.warn(exchange);
  }


  async showCoinOnMarketCap(coin: string) {
    const MC = await this.marketCap.getTicker();
    const mc = MC[coin];
    window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
  }

}
