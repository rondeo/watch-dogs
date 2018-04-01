import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "./soket-connector.service";
import * as pako from 'pako';
import * as gzip from 'gzip';
import {IChannel, SocketBase} from "./soket-base";


export class HitbtcTradesSocket extends SocketBase {

  exchange = 'hitbtc';
  socketUrl = 'wss://api.hitbtc.com/api/2/ws';
  constructor() {
    super();
    //const ar = market.split('_');

  }

  onMessage(m) {

   let dataM: any = JSON.parse(m.data);

     console.log(dataM);

      if(dataM.method === 'updateTrades'){
        const channel = 'trades';
        const marketId = dataM.params.symbol;

        const id = this.exchange + channel + marketId;
        const rawAr = dataM.params.data;
        rawAr.forEach((raw)=>{
          const data = {
            amountCoin: raw.side ==='buy' ? +raw.quantity : -raw.quantity,
            rate: +raw.price,
            timestamp: new Date(raw.timestamp).getTime(),
            uuid: +raw.id
          };
          this.dispatch(id, data);
        })

      }
  }


  async createChannelId(channel, market):Promise<string>{
console.log('createChannelId', channel, market);

    const id = Date.now();
    const marketId = market.replace('USDT', 'USD').split('_').reverse().join('');
    switch(channel){
      case 'trades':
        let params = {
          method: "subscribeTrades",
          params: {
            symbol: marketId
          },
          id: id
        };
        this.send(JSON.stringify(params));
        break;

    }

    return Promise.resolve(this.exchange+channel+marketId);
  }


}
