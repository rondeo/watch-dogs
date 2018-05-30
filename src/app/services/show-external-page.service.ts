import { Injectable } from '@angular/core';
import {ApiMarketCapService} from '../apis/api-market-cap.service';
import {MarketCapService} from '../market-cap/services/market-cap.service';

@Injectable()
export class ShowExternalPageService {

  constructor(
    private marketCap: MarketCapService
  ) { }

  showMarket(exchange: string, base: string, coin: string){
    let url
    switch(exchange){
      case 'bittrex':
       url = 'https://bittrex.com/Market/Index?MarketName={{base}}-{{coin}}'.replace('{{base}}', base).replace('{{coin}}', coin);
        break;
    }

    if(url)window.open(url, '_blank');
    else console.warn(exchange);
  }


  showCoinOnMarketCap(coin:string){
    this.marketCap.getCoinsObs().subscribe(MC =>{
      const mc = MC[coin];
      window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
    })


  }

}
