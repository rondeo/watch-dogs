import {Injectable} from '@angular/core';
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {BitfinexTradesSocket} from "./bitfinex-trades-socket";
import {PoloniexTradesSocket} from "./poloniex-trade-socket";
import {BinanceTradesSocket} from "./binance-trade-socket";

import {HuobiTradesSocket} from "./huobi-trade-socket";
import {OkexTradesSocket} from "./okex-trade-socket";
import {HitbtcTradesSocket} from "./hitbtc-trade-socket";
import {SocketBase} from "./soket-base";
import {BittrexTradesSocket} from "./bittrex/bittrex-trades-socket";


export interface IVOTrade {
  amountCoin: number;
  rate: number;
  timestamp: number;
  uuid: string
}

@Injectable()
export class SoketConnectorService {

  sockets: { [exchange: string]: SocketBase} = {};

  constructor() {

  }

  getSubscription(exchange: string, chanel: string, market: string): Observable<any> {

    if (!this.sockets[exchange]) {
      this.sockets[exchange] =  this.creataSoket(exchange, market, chanel);
    }

    return this.sockets[exchange].subscribe(chanel, market)

  }

  unsubscribe(exchange: string, chanel: string, market: string) {

  }



  private creataSoket(exchange: string, market:string, channel:string): any  {
    switch (exchange) {
      case 'bitfinex':
        return new BitfinexTradesSocket();//  new WebSocket('wss://api.bitfinex.com/ws/2');
      case 'poloniex':
        return new PoloniexTradesSocket();
      case 'binance':
        return new BinanceTradesSocket();  // WebSocket('wss://stream.binance.com:9443/ws/' + market.split('_').reverse().join('').toLocaleLowerCase()+ '@' + channel.slice(0,-1));
      case 'huobi':
        return new HuobiTradesSocket() //WebSocket('wss://api.huobi.pro/ws');
      case 'okex':
        return new  OkexTradesSocket(); // WebSocket('wss://real.okex.com:10440/websocket/okexapi');
      case 'hitbtc':
        return new HitbtcTradesSocket()
      case 'bittrex':
        return new BittrexTradesSocket();
    }
    return null;


  }
}
