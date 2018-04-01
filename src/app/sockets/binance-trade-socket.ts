import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "./soket-connector.service";
import {SocketBase} from "./soket-base";


export class BinanceTradesSocket extends SocketBase {
  hb: number;
  exchange = 'binance';
  socketUrl = 'wss://stream.binance.com:9443/ws/';

  ws: WebSocket;

  constructor() {
    super();

  }

  marketsIds:any ={};

  createSocket(channel, market) {
    const marketId = market.split('_').reverse().join('').toLocaleLowerCase();

    this.marketsIds[marketId] = market;

    const suffix = marketId + '@' + channel.slice(0,-1);
    const ws = new WebSocket(this.socketUrl + suffix);
    ws.addEventListener('message', (msg) => this.onMessage(msg));
    this.ws = ws;
  }

  async createChannelId(channel, market):Promise<string>{
    console.log('createChannelId', channel, market);

    const id = Date.now();

    return Promise.resolve(this.exchange+channel+market);
  }


  onMessage(m: MessageEvent) {

    let dataM: any = JSON.parse(m.data);

   //console.log(dataM);

    if (dataM.length === 1) {
      this.hb = Date.now();
      this.ws.send('.');
      console.log(this.exchange + ' HB')
      return
    }

    let channel = dataM.e;
    const marketId = dataM.s.toLocaleLowerCase();
    let market = this.marketsIds[marketId];

    if (dataM.e === 'trade') {
      channel = 'trades';

      const data = {
        amountCoin:dataM.m? +dataM.q:-dataM.q,
        rate: +dataM.p,
        timestamp:+dataM.T,
        uuid: +dataM.b
      }
      const id = this.exchange + channel + market;
      this.dispatch(id, data);
    }

  }

}
