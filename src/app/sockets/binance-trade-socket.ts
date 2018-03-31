import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "./soket-connector.service";


export class BinanceTradesSocket implements ISocketChannel {
  private version = 2;
  private chanId = 0;
  private hb: number;
  private exchange = 'binance';
  private _market: string;
  sub: Subject<any> = new Subject<any>();
  private ws: WebSocket

  constructor(public channel: string, public market: string) {
    //const ar = market.split('_');
    this._market = market;

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

  private onMessage(m: MessageEvent) {
    let dataM: any = JSON.parse(m.data);

  //  console.log(dataM);

    if (dataM.length === 1) {
      this.hb = Date.now();
      this.ws.send('.');
      console.log(this.exchange + ' HB')
      return
    }

    if (dataM.e === 'trade') {
      const data = {
        amountCoin:dataM.m? +dataM.q:-dataM.q,
        rate: +dataM.p,
        timestamp:+dataM.T,
        uuid: +dataM.b
      }
      const exchange = this.exchange;
      const market = this.market;
      const channel = this.channel;
      this.sub.next({data, exchange, market, channel})

    }


  }

  private connect() {
    let params = {
      command: "subscribe",
      //symbol: this._market,
      channel: this._market

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
      // this.ws.send(JSON.stringify(params));

    } else {
      setTimeout(() => this.connect(), 1000);
    }

  }
}
