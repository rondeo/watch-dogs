import {Injectable} from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {MarketCapService} from '../market-cap/services/market-cap.service';

@Injectable()
export class ShowExternalPageService {

  constructor(
    private marketCap: ApiMarketCapService
  ) {
  }

  showMarket(exchange: string, base: string, coin: string) {
    let url
    switch (exchange) {
      case 'bittrex':
        url = 'https://bittrex.com/Market/Index?MarketName={{base}}-{{coin}}'.replace('{{base}}', base).replace('{{coin}}', coin);
        break;
      case 'binance':
        url = 'https://www.binance.com/trade.html?symbol={{coin}}_{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
        break;
      case 'poloniex':
        url = 'https://poloniex.com/exchange#{{base}}_{{coin}}'.replace('{{base}}', base).replace('{{coin}}', coin);
        break;
      case 'hitbtc':
        url = 'https://hitbtc.com/{{coin}}-to-{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
        break;
      case 'cryptopia':
        url = 'https://www.cryptopia.co.nz/Exchange/?market={{coin}}_{{base}}'.replace('{{base}}', base).replace('{{coin}}', coin);
        break;
      case 'bitfinex':
        url = 'https://www.bfxdata.com/orderbooks/{{coin}}{{base}}'.replace('{{base}}', base.toLowerCase()).replace('{{coin}}', coin.toLowerCase());
        break;


    }

    if (url) window.open(url, '_blank');
    else console.warn(exchange);
  }


  async showCoinOnMarketCap(coin: string) {
    const MC = await this.marketCap.getData();
    const mc = MC[coin];
    window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
  }

}
