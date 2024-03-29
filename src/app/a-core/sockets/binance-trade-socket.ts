
import {SocketBase} from './soket-base';


export class BinanceTradesSocket extends SocketBase {
  exchange = 'binance';
  socketUrl = 'wss://stream.binance.com:9443/ws/';
  // HB = '.';

  constructor() {
    super();
  }

  marketsIds: any = {};
  sockets: WebSocket[];
  createSocket(channel, market): WebSocket {

    const marketId = market.split('_').reverse().join('').toLocaleLowerCase();

    this.marketsIds[marketId] = market;

    const suffix = marketId + '@' + channel.slice(0, -1);
    const ws = new WebSocket(this.socketUrl + suffix);
    ws.addEventListener('message', (msg) => this.onMessage(msg));
    ws.addEventListener('open', (evt) => this.onOpen(evt));
    ws.addEventListener('close', (evt) => this.onClose(evt));
    ws.addEventListener('error', (evt) => this.onError(evt));
    return ws;
  }

  async createChannelId(channel, market): Promise<string> {
    console.log('createChannelId', channel, market);

    const id = Date.now();

    return Promise.resolve(this.exchange + channel + market);
  }


  onMessage(m: any) {

    let dataM: any = JSON.parse(m.data);

  // console.log(dataM);

    let channel = dataM.e;
    const marketId = dataM.s.toLocaleLowerCase();
    let market = this.marketsIds[marketId];

    if (dataM.e === 'trade') {
      channel = 'trades';

      const data = {
        amountCoin: dataM.m ? -dataM.q : +dataM.q,
        rate: +dataM.p,
        timestamp: +dataM.T,
        uuid: +dataM.b
      };
      const id = this.exchange + channel + market;
      this.dispatch(id, data);
    }

  }

}
