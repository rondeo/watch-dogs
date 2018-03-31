import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "../soket-connector.service";
import * as  signalR from 'signalr-client';


export class BittrexTradesSocket implements ISocketChannel {
  private version = 2;
  private chanId = 0;
  private hb: number;
  private exchange = 'bittrex';
  private _market: string;
  sub: Subject<any> = new Subject<any>();
  private ws: WebSocket

  constructor(public channel: string, public market: string) {
    //const ar = market.split('_');
    this._market = market;

  }

  setSocket( ws: WebSocket){
    this.ws = ws;
    ws.addEventListener('message', (msg) => this.onMessage(msg));
    setTimeout(()=>this.connect(), 1000);
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


    // console.log(m);
    let dataM: any[] = JSON.parse(m.data);

    // console.log(dataM);

    if (dataM.length === 1) {
      this.hb = Date.now();
      this.ws.send('.');
      console.log('HB')
      return
    }


    if (this.chanId && dataM[0] === this.chanId) {

      let msgs: any[] = dataM[2];
      msgs.forEach((msg: any[]) => {
        switch (msg[0]) {
          case 'i':
            console.log(' i again ', msgs);
            break;
          case 'o':
            break;
          case 't':
            const data = {
              uuid: msg[1],
              timestamp: msg[5] * 1000,
              amountCoin: +(msg[2] ? msg[4] : -msg[4]),
              rate: +msg[3]
            };
            const exchange = this.exchange;
            const market = this.market;
            const channel = this.channel;
            this.sub.next({data, channel, exchange, market});

            break
        }
      });

    } else {

      let msg: any[] = dataM[2];
      // console.log(msg[0]);

      if (msg[0][0] === 'i') {
        console.log(' seting channel id ' + dataM[0]);
        this.chanId = dataM[0];
        this.initData(msg[0][1]);
      }

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
      console.warn(params);
      this.ws.send(JSON.stringify(params));

    } else {
      setTimeout(() => this.connect(), 1000);
    }

  }
}
