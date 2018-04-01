import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "../soket-connector.service";
import {SocketBase} from "../soket-base";


export class BitfinexTradesSocket extends SocketBase {

  socketUrl = 'wss://api.bitfinex.com/ws/2';
  private version = 2;
  private chanId = 0

  exchange = 'bitfinex';
  sub: Subject<any> = new Subject<any>();

  constructor() {
    super();
  }


  async createChannelId(channel, market): Promise<string> {
    console.log('createChannelId', channel, market);

    const id = Date.now();
    const ar = market.split('_');
    const marketId = 't' + ar[1] + ar[0].replace('USDT', 'USD')
    switch (channel) {
      case 'trades':

        let params = {
          event: "subscribe",
          symbol: marketId,
          channel: channel

        };
        this.send(JSON.stringify(params));
        break;
    }

    return Promise.resolve(this.exchange + channel + marketId);
  }

  private channels: any = {};

  onMessage(m) {
    let data = JSON.parse(m.data);
    //  console.log(data);

    switch (data.event) {
      case 'info':
        if (data.version !== this.version) {
          console.warn(' wrong version ' + this.version, data)
        }
        break;
      case 'subscribed':
       // console.warn(data);
        // {event:"subscribed","channel":"trades","chanId":106,"symbol":"tBTCUSD","pair":"BTCUSD"}
        const market = data.symbol;
        const chanId = data.chanId;
        this.channels[chanId] = market;

        break;
      case 'unsubscribed':
        console.log('unsubscribed')
        this.sub.next({evt: 2, message: 'unsubscribed'});
        break;
      default:
        this.onData(data);
    }


  }

  private prev: any = {};

  onData(msg) {
    // console.log('msg ', msg);
    let load: number[];
    let data:any

    let channel: string;
    const chanId = msg[0];
    const market = this.channels[chanId];


    if (!market) {
      console.warn(' no market ' , msg);
      return;
    }

    switch (msg[1]) {
      case 'te':
        load = msg[2];
        this.prev[load[0]] = msg[2];
        break;
      case 'tu':
        load = msg[2];
        if (!this.prev[load[0]]) {
          console.log(' no prev value');
          return;
        }
        delete this.prev[load[0]];
        channel = 'trades';
        data = {
          uuid: load[0],
          timestamp: load[1],
          amountCoin: load[2],
          rate: load[3]
        };

        this.dispatch(this.exchange + channel + market, data);

        break;
      case 'hb':
        this.ws.send('.');
        break
      default:

        if(market && Array.isArray(msg[1])){
          channel = 'trades';
           data = msg[1].map(function (item: number[]) {
             return {
               uuid: item[0],
               timestamp: item[1],
               amountCoin: item[2],
               rate: item[3]
             };
           });

           this.dispatch(this.exchange + channel + market, data, 'inittrades');
        }else console.warn(msg);

        break;


    }
  }

}
