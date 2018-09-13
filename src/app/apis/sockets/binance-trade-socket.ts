import {Subject} from 'rxjs/Subject';
import {SocketBase} from './soket-base';
import {SocketChannel} from './socket-channel';


export class BinanceTradesSocket extends SocketBase {
  exchange = 'binance';
  socketUrl = 'wss://stream.binance.com:9443/ws/';

  //HB = '.';

  constructor() {
    super();
  }

  sockets: WebSocket[] = [];


  async getSocket(channel: SocketChannel): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
      const marketId = channel.market.split('_').reverse().join('').toLocaleLowerCase();
      // this.marketsIds[marketId] = market;

      this.marketIDs[marketId] = channel.market;
      let ch: string;

      switch (channel.channel) {
        case 'trades':
          ch = 'trade';
          break;
        case 'books':
          ch = 'depth';
          break;
      }

      const url = this.socketUrl + marketId + '@' + ch;
      console.log(url);
      const ws = new WebSocket(url);

      ws.addEventListener('message', (evt) => this.onMessage(evt));
      ws.addEventListener('open', (evt)=> this.onOpen(evt, resolve, reject));
      ws.addEventListener('close', (evt) => {
        console.log('close  ', evt)
      });
      ws.addEventListener('error', (evt) => {
        console.log('error', evt)
        reject();
      });
    });

  }

  async subscribeForChannel(channel: SocketChannel): Promise<any> {
    console.log('createChannelId', channel);
    const socket = await this.getSocket(channel);
    this.sockets.push(socket);
    return socket
  }


  onMessage(m: MessageEvent) {

    let dataM: any = JSON.parse(m.data);

    console.log(dataM);

    let channel = dataM.e;
    const marketId = dataM.s.toLocaleLowerCase();
    let market = this.marketIDs[marketId];

    if (dataM.e === 'trade') {
      channel = 'trades';
      const data = {
        market: market,
        exchange: this.exchange,
        amountCoin: dataM.m ? -dataM.q : +dataM.q,
        rate: +dataM.p,
        timestamp: +dataM.T,
        uuid: +dataM.b
      };

      if (!this.dispatch(channel, market, data)) {
        console.log(' no subscribers closing ' + this.exchange + '  ' + channel + '  ' + market)
        const ws: WebSocket = <WebSocket>m.currentTarget;
        ws.close();
      }
    }

  }

}
