import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "./soket-connector.service";
import * as pako from 'pako';
import * as gzip from 'gzip';


export class HitbtcTradesSocket implements ISocketChannel {
  private version = 2;
  private chanId = 0;
  private hb: number;
  private exchange = 'hitbtc';
  private _market: string;
  sub: Subject<any> = new Subject<any>();
  private ws: WebSocket

  constructor(public channel: string, public market: string) {
    //const ar = market.split('_');
    this._market = market.replace('USDT', 'USD');

  }

  setSocket(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener('message', (msg) => this.onMessage(msg));
    setTimeout(() => this.connect(), 1000);
  }

  private initData(data: { currencyPair: string, aordersBook: any[] }) {
    if (data.currencyPair !== this._market) {
      console.warn(' not my channel');
      return;
    }
    const exchange = this.exchange;
    const market = this.market;
    const channel = this.channel;
    // this.sub.next({data, exchange, market, channel})

  }

  private onMessage(m) {

   let dataM: any = JSON.parse(m.data);

    //  console.log(dataM);
    const exchange = this.exchange;
    const market = this.market;
    const channel = this.channel;

      if(dataM.method === 'updateTrades'){
        const rawAr = dataM.params.data;
        rawAr.forEach((raw)=>{
          const data = {
            amountCoin: raw.side ==='buy' ? +raw.quantity : -raw.quantity,
            rate: +raw.price,
            timestamp: new Date(raw.timestamp).getTime(),
            uuid: +raw.id
          }
          this.sub.next({data, exchange, market, channel});
        })

      }
  }


  private connect() {
    const id = Date.now();

    //{'event':'addChannel','channel':'ok_sub_spotusd_btc_trades'}");
    // 		//doSend("{'event':'addChannel','channel':'ok_sub_spotusd_ltc_trades'}

    let params = {
      method: "subscribeTrades",
      params: {
        symbol: this._market.split('_').reverse().join('').toLocaleLowerCase()
      },
      id: id
    };

    console.log(this.ws);
    console.warn(this.ws.readyState);
    if (this.ws.readyState === this.ws.CLOSING) {
      console.log('CLOSING');

    } else if (this.ws.readyState === this.ws.CONNECTING) {
      console.log('CONNECTING');
      setTimeout(() => this.connect(), 1000);

    } else if (this.ws.readyState === this.ws.CLOSED) {
      console.log('CLOSED');

    } else if (this.ws.readyState === this.ws.OPEN) {
      console.log(params);
      this.ws.send(JSON.stringify(params));

    } else {
      setTimeout(() => this.connect(), 1000);
    }

  }
}
