import {Subject} from "rxjs/Subject";
import {SocketBase} from "./soket-base";
import {SocketChannel} from './socket-channel';



export class PoloniexTradesSocket extends SocketBase {
  private version = 2;
  private chanId = 0;
  socketUrl = 'wss://api2.poloniex.com';
  exchange = 'poloniex';
  HB = '.';

  constructor() {
    super();

  }


 // private channels: any = {};

  onMessage(m: MessageEvent) {

    // console.log(m);

    let channel: string
    const ar = JSON.parse(m.data);
   // console.log(ar);
    if (ar[0] === 1010) {
      this.hb = Date.now();
      return
    }

    let dataAr: any[] = ar[2];

    if (!Array.isArray(dataAr)) {
      console.warn(ar);
      return;
    }

    const market = this.channels[ar[0]];

    dataAr.forEach((msg: any[]) => {

      switch (msg[0]) {
        case 'i':
          const channelId = ar[0];
          const currencyPair = msg[1].currencyPair;
          const aordersBook = msg[1].aordersBook;
          this.channels[channelId] = currencyPair;

          break;
        case 'o':
          channel = 'books';

          /*this.dispatch(this.exchange + channel + market, {
            amountCoin: msg[1] ? +msg[3] : -msg[3],
            rate: +msg[2]
          });*/

          break;
        case 't':
          const data = {
            uuid: msg[1],
            timestamp: msg[5] * 1000,
            amountCoin: +(msg[2] ? msg[4] : -msg[4]),
            rate: +msg[3]
          };
          this.dispatch(this.exchange + market, data, 'trades');

          break
      }
    });

  }


  async subscribeForChannel(channel: SocketChannel): Promise<any> {
    console.log('createChannel', channel);
    const id = Date.now();

    const socket = await this.getSocket(channel);

    switch (channel.channel) {
      case 'trades':
        let params = {
          command: "subscribe",
          channel: channel.market

        };
        socket.send(JSON.stringify(params));
        break;
    }

    return channel;





   // return Promise.resolve(this.exchange + market);
  }


}
