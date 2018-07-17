import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {MarketCapService} from '../market-cap/services/market-cap.service';
import {ApisPublicService} from '../apis/apis-public.service';

@Injectable()
export class ShowExternalPageService {


  constructor(
    private marketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {

  }

   showMarket(exchange: string, base: string, coin: string) {
    const url = this.apisPublic.getExchangeApi(exchange).getMarketUrl(base, coin);
    if (url) window.open(url, '_blank');
    else console.warn(exchange);
  }


  async showCoinOnMarketCap(coin: string) {
    const MC = await this.marketCap.getData();
    const mc = MC[coin];
    window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
  }

}
