
import * as pako from 'pako';
import * as gzip from 'gzip';
import {IChannel, SocketBase} from "./soket-base";


export class HitbtcTradesSocket extends SocketBase {

  exchange = 'hitbtc';
  socketUrl = 'wss://api.hitbtc.com/api/2/ws';


  constructor() {
    super();
  }

  marketids: any = {};

  onMessage(m) {

    let dataM: any = JSON.parse(m.data);
    let channel = dataM.method;
    if(!channel){
      if(dataM.id && dataM.result){
        console.log('subscribed for id ' + dataM.id)
        return
      }
      console.warn(this.exchange + ' no method  ', dataM);
      return;
    }

    const marketId = dataM.params.symbol;

    const market = this.marketids[marketId];
    const id = this.exchange + market;

    switch (channel) {
      case 'updateTrades':
        const rawAr = dataM.params.data;
        rawAr.forEach((raw) => {
          const data = {
            amountCoin: raw.side === 'buy' ? +raw.quantity : -raw.quantity,
            rate: +raw.price,
            timestamp: new Date(raw.timestamp).getTime(),
            uuid: +raw.id
          };

          this.dispatch(id, data);
        })

        break;
      case 'updateOrderbook':
        const ask = dataM.params.ask.map(function (item) {
          return {
            rate: +item.price,
            amountCoin: +item.size
          }
        })

        const bid = dataM.params.bid.map(function (item) {
          return {
            rate: +item.price,
            amountCoin: +item.size
          }
        });
        this.dispatch(id, {ask, bid}, 'books');
        break;
      case 'snapshotOrderbook':
        console.log(this.exchange + 'snapshotOrderbook');
        break;
      case 'snapshotTrades':
        console.log(this.exchange + 'snapshotTrades');
        break;
      default:
        console.warn(dataM)
    }


  }


  subscriptions :any ={};

  async createChannelId(channel, market): Promise<string> {
    console.log('createChannelId', channel, market);

    const id = Date.now();
    this.subscriptions[id] = 'trades';
    this.subscriptions[id+1] = 'books';

    const marketId = market.replace('USDT', 'USD').split('_').reverse().join('');

    this.marketids[marketId] = market;
    switch (channel) {
      case 'trades':
        let params = {
          method: "subscribeTrades",
          params: {
            symbol: marketId
          },
          id: id
        };
        this.send(JSON.stringify(params));

      /*  let params2 = {
          method: "subscribeOrderbook",
          params: {
            symbol: marketId
          },
          id: id + 1
        };
        this.send(JSON.stringify(params2));*/
        break;

    }

    return Promise.resolve(this.exchange + market);
  }


}
