import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "../soket-connector.service";
import {SocketBase} from "../soket-base";


export class PoloniexTradesSocket extends SocketBase {
  private version = 2;
  private chanId = 0;
  socketUrl = 'wss://api2.poloniex.com';
  exchange = 'poloniex';

  constructor() {
    super();

  }

  private channels: any = {};

  onMessage(m: MessageEvent) {

    // console.log(m);

    let channel: string
    const ar = JSON.parse(m.data);
   // console.log(ar);
    if (ar[0] === 1010) {
      this.hb = Date.now();
      this.ws.send('.');
      console.log(this.exchange + ' HB');
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
          channel = 'trades';
          const data = {
            uuid: msg[1],
            timestamp: msg[5] * 1000,
            amountCoin: +(msg[2] ? msg[4] : -msg[4]),
            rate: +msg[3]
          };
          this.dispatch(this.exchange + channel + market, data);

          break
      }
    });

  }

  async createChannelId(channel, market): Promise<string> {
    console.log('createChannelId', channel, market);

    const id = Date.now();
    const marketId = market;
    switch (channel) {
      case 'trades':
        let params = {
          command: "subscribe",
          channel: marketId

        };
        this.send(JSON.stringify(params));
        break;
    }

    return Promise.resolve(this.exchange + channel + marketId);
  }


}
