import {Subject} from "rxjs/Subject";


export interface ISocketData {
  data: any;
  exchange: string;
  market: string
  channel: string
}

export interface IChannel {
  market: string;
  channel: string;
  sub: Subject<any>;
}

export abstract class SocketBase {
  ws: WebSocket;
 abstract socketUrl: string;
  hb: number;
  exchange: string;
  market: string;

  marketsMap: { [marketId: string]: string } = {};

  //sub: Subject<ISocketData> = new Subject<ISocketData>();

  constructor() {

  }

  subscribers: { [id: string]: IChannel } = {};


  createSocket(chanel, market) {
    const ws = new WebSocket(this.socketUrl);
    ws.addEventListener('message', (msg) => this.onMessage(msg));
    this.ws = ws;
  }

  dispatch(id: string, data, newChannel:string = null) {
    let ch = this.subscribers[id]
    if(!ch){
      console.warn(id);
      return;
    }
    const channel = newChannel || ch.channel;
    const market = ch.market;
    const exchange = this.exchange;
    ch.sub.next({exchange, channel, market, data});
  }

  abstract async createChannelId(chanel, market): Promise<string>

  async createChannel(channel, market, sub: Subject<any>) {

    let id = await this.createChannelId(channel, market);
    this.subscribers[id] = {
      channel,
      market,
      sub
    }
    //  return this.subscribeForTrades(market)

  }


  subscribe(chanel, market) {
    let sub = new Subject();
    if (!this.ws) this.createSocket(chanel, market);
    this.createChannel(chanel, market, sub);
    return sub;
  }

  /*subscribeForTrades(market: string) {
    return this.sub;

  }*/


  abstract onMessage(m) ;

  isQ: boolean;

  send(params) {

    const ws = this.ws;

    if (ws.readyState === ws.OPEN) {
      this.isQ = false;
      console.log(params);
      ws.send(params);
    } else {
      this.isQ = true;
      this.checkState();
      setTimeout(() => this.send(params), 2000);
    }

  }


  checkState() {
    const ws = this.ws;
    console.log(ws.readyState);
    if (ws.readyState === ws.CLOSING) {
      console.log('CLOSING');

    } else if (ws.readyState === ws.CONNECTING) {
      console.log('CONNECTING');
      // setTimeout(() => this.connect(), 1000);

    } else if (ws.readyState === ws.CLOSED) {
      console.log('CLOSED');

    } else if (ws.readyState === ws.OPEN) {
      console.log('OPEN');

      //this.ws.send(JSON.stringify(params));

    }
  }


}
