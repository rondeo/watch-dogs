import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "../soket-connector.service";


export class BitfinexTradesSocket implements ISocketChannel{
  private ws:WebSocket;
  private version = 2;
  private chanId = 0;
  private hb: number;
  private exchange = 'bitfinex';
  private _market:string;
  sub:Subject<any> = new Subject<any>();

  constructor( public channel: string, public market: string) {
    const ar = market.split('_');
    this._market = 't' + ar[1]+ ar[0].replace('USDT', 'USD');
  }

  setSocket( ws: WebSocket){
    this.ws = ws;
    ws.addEventListener('message', (msg) => this.onMessage(msg));
    setTimeout(()=>this.connect(), 1000);
  }

  private onMessage(m) {
    let data = JSON.parse(m.data);
   //  console.log(data);

    if(this.chanId && data[0] === this.chanId){
      this.onData(data);
    } else if (data.event) {
      switch (data.event) {
        case 'info':
          if (data.version !== this.version) {
            console.warn(' wrong version ' + this.version, data)
          }
          break;
        case 'subscribed':
          // {event:"subscribed","channel":"trades","chanId":106,"symbol":"tBTCUSD","pair":"BTCUSD"}
          if (data.symbol !== this._market || this.channel !== data.channel) {
            console.log(' not my subscription ', data);
            return;
          } else {
            this.chanId = data.chanId;
            console.log('subscribed ', this)
          }
          break;
        case 'unsubscribed':
          console.log('unsubscribed')
          this.sub.next({evt: 2, message: 'unsubscribed'});
          break;
        default:
          console.warn('unknown event ', data);
      }

    }

  }

  private prev: any = {};

  onData(msg) {

    let load: number[];
    if (msg[0] !== this.chanId) {
      return;
    }

    // let load:number[] = data[2];
    if (msg[1] === 'te') {
      load = msg[2];
      this.prev[load[0]] = msg[2];
    } else if (msg[1] === 'tu') {
      load = msg[2];
      if (!this.prev[load[0]]) {
        console.log(' no prev value');
        return;
      }
      delete this.prev[load[0]];
      const data = {
        uuid: load[0],
        timestamp: load[1],
        amountCoin: load[2],
        rate: load[3]
      };
      const exchange = this.exchange;
      const market = this.market;
      const channel = this.channel;
      this.sub.next({data, channel, exchange, market});

    } else if (msg[1] === 'hb') {
      this.hb = Date.now();
      console.log(this.exchange + ' HB');
      this.ws.send('.');
    } else {
      if (msg[0] !== this.chanId) {
        console.warn(' not my data');
        return;
      }

      let data = msg[1].map(function (item: number[]) {
        return {
          uuid: item[0],
          timestamp: item[1],
          amountCoin: item[2],
          rate: item[3]
        };
      });
      const exchange = this.exchange;
      const market = this.market;
      const channel = this.channel;
      this.sub.next({data, channel, exchange, market});
    }
  }

  private connect() {
    let params = {
      event: "subscribe",
      symbol: this._market,
      channel: this.channel

    };
     console.warn(this.ws.readyState);
    if(this.ws.readyState === this.ws.OPEN){
      this.ws.send(JSON.stringify(params));

    } else {
      setTimeout(()=>this.connect(), 1000);
    }

  }

}
