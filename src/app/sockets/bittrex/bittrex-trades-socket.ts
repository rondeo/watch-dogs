

import * as  signalR from 'signalr-client';
import {SocketBase} from "../soket-base";


export class BittrexTradesSocket extends SocketBase {

  exchange = 'bittrex';
  socketUrl = 'ws://localhost:5000';

  constructor() {
    super();

  }

  async createChannelId(channel, market): Promise<string> {

    this.send(JSON.stringify({event: 'subscribe', market: market.replace('_', '-')}));

    return Promise.resolve(this.exchange + market);
  }

  onMessage(m: MessageEvent) {
    // console.log(m);

    let dataM: any = JSON.parse(m.data);
    const market = dataM.MarketName.replace('-', '_');


    //  console.log(dataM);
    const nonce = dataM.Nounce;
    const exchange = this.exchange;
    const channel = 'trades'
//
   //   console.log(dataM.Fills)

    if (Array.isArray(dataM.Fills)) {
      dataM.Fills.forEach((item, i) => {

        this.dispatch(exchange + market, {
          uuid: nonce + i,
          amountCoin: item.OrderType === 'BUY' ? +item.Quantity : -item.Quantity,
          rate: +item.Rate,
          timestamp: new Date(item.TimeStamp + 'Z').getTime()
        }, 'trades');

      })


    }


  }


}
