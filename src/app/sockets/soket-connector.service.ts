import {Injectable} from '@angular/core';
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {BitfinexTradesSocket} from "./bitfinex/bitfinex-trades-socket";
import {PoloniexTradesSocket} from "./poloniex/poloniex-trade-socket";
import {BittrexTradesSocket} from "./bittrex/bittrex-trades-socket";
import {BinanceTradesSocket} from "./binance-trade-socket";
import {BittrexSocket} from "./bittrex/bittrex-socket";
import {HuobiTradesSocket} from "./huobi-trade-socket";
import {OkexTradesSocket} from "./okex-trade-socket";
import {HitbtcTradesSocket} from "./hitbtc-trade-socket";


export interface ISocketChannel {
  channel: string;
  market: string;
  sub: Subject<any>;
  setSocket(ws: WebSocket | BittrexSocket);
}

interface MySoket {
  socket: WebSocket | BittrexSocket;
  exchange: string;
  channnels: ISocketChannel[]
}

export interface IVOTrade {
  amountCoin: number;
  rate: number;
  timestamp: number;
  uuid: string
}

@Injectable()
export class SoketConnectorService {

  sockets: { [exchange: string]: MySoket } = {};

  constructor() {
  }


  getSubscription(exchange: string, chanel: string, market: string): Observable<any> {
    if (!this.sockets[exchange]) {
      const ws = this.creataSoket(exchange, market, chanel);

      ws.onclose = () => {
        console.warn(' socket closed ' + ws.url);
        console.log(' recretaing ');
        let ws2 = this.creataSoket(exchange, market, chanel);

        this.sockets[exchange].socket = ws2;
        this.sockets[exchange].channnels.forEach(function (ch) {
          ch.setSocket(ws2);
        })
      }
      let ch = this.createChannel(exchange, chanel, market);
      ch.setSocket(ws);

      this.sockets[exchange] = {
        socket: ws,
        exchange: exchange,
        channnels: [ch]
      }
      return ch.sub.asObservable()
    } else {
      const exists: ISocketChannel = this.sockets[exchange].channnels.find(function (item) {
        return item.channel === chanel && item.market === market;
      });
      if (exists) return exists.sub.asObservable();
      else {

        const ch: ISocketChannel = this.createChannel(exchange, chanel, market);
        ch.setSocket(this.sockets[exchange].socket);
        this.sockets[exchange].channnels.push(ch);
        return ch.sub.asObservable();
      }
    }
  }

  unsubscribe(exchange: string, chanel: string, market: string) {

  }

  private createChannel(exchange: string, chanel: string, market: string): ISocketChannel {

    switch (exchange + chanel) {
      case 'bitfinextrades':
        return new BitfinexTradesSocket(chanel, market);
      case 'poloniextrades':
        return new PoloniexTradesSocket(chanel, market);
      case 'bittrextrades':
        return new BittrexTradesSocket(chanel, market);
      case 'binancetrades':
        return new BinanceTradesSocket(chanel, market);
      case 'huobitrades':
        return new HuobiTradesSocket(chanel, market);
      case 'okextrades':
        return new OkexTradesSocket(chanel, market);
      case 'hitbtctrades':
        return new HitbtcTradesSocket(chanel, market);
    }
  }

  private creataSoket(exchange: string, market:string, channel:string): WebSocket  {
    switch (exchange) {
      case 'bitfinex':
        return new WebSocket('wss://api.bitfinex.com/ws/2');
      case 'poloniex':
        return new WebSocket('wss://api2.poloniex.com');
      case 'binance':
        return new WebSocket('wss://stream.binance.com:9443/ws/' + market.split('_').reverse().join('').toLocaleLowerCase()+ '@' + channel.slice(0,-1));
      case 'huobi':
        return new WebSocket('wss://api.huobi.pro/ws');
      case 'okex':
        return new WebSocket('wss://real.okex.com:10440/websocket/okexapi');
      case 'hitbtc':
        return new WebSocket('wss://api.hitbtc.com/api/2/ws');
    }
    return null;


  }
}
