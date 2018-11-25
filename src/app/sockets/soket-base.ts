import {Subject} from 'rxjs/internal/Subject';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';


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

  statusSub:BehaviorSubject<string> = new BehaviorSubject('CLOSED');

  HB: string;
  marketsMap: { [marketId: string]: string } = {};

  //sub: Subject<ISocketData> = new Subject<ISocketData>();

  constructor() {

  }

  private intevalHB;

  onOpen(evt) {

    console.log('%c ' + this.exchange + ' OPEN', 'color:green');

    clearInterval(this.intevalHB);
    this.intevalHB = setInterval(() => {
      this.checkState();
      if (this.ws.readyState === this.ws.OPEN && this.HB) {
        this.ws.send(this.HB);
      }

    }, 60000)

  }

  onClose(evt){
    console.warn(this.exchange + ' CLOSE');
  }
  onError(err){
    console.warn(err);
  }
  reconnect() {
    this.ws = null;
    let channelsAr: IChannel[] = Object.values(this.subscribers);

    channelsAr.forEach((item) => {
      this.createChannel(item.channel, item.market, item.sub);

    })

  }

  subscribers: { [id: string]: IChannel } = {};


  createSocket(chanel, market): WebSocket {
    if (this.ws) return this.ws;
    const ws = new WebSocket(this.socketUrl);
    ws.addEventListener('message', (evt) => this.onMessage(evt));
    ws.addEventListener('open', (evt) => this.onOpen(evt));
    ws.addEventListener('close', (evt) => this.onClose(evt));
    ws.addEventListener('error', (evt) => this.onError(evt));
    return ws;
  }

  dispatch(id: string, data, newChannel: string = null) {
    let ch = this.subscribers[id]
    if (!ch) {
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
    this.ws = this.createSocket(channel, market);
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
      console.log(this.exchange + params);
      ws.send(params);
    } else {
      this.isQ = true;
      this.checkState();
      setTimeout(() => this.send(params), 2000);
    }

  }


  checkState() {
    const ws = this.ws;

    if (ws.readyState === ws.CLOSING) {
      this.statusSub.next('CLOSING');
      console.log(this.exchange + ' CLOSING');

    } else if (ws.readyState === ws.CONNECTING) {
      console.log(this.exchange + ' CONNECTING');
      this.statusSub.next('CONNECTING');

      // setTimeout(() => this.connect(), 1000);

    } else if (ws.readyState === ws.CLOSED) {
      console.log(this.exchange + ' CLOSED');
      this.statusSub.next('CLOSED');
     // setTimeout(() => this.reconnect(), 1000);

    } else if (ws.readyState === ws.OPEN) {
      console.log('%c ' + this.exchange + ' OPEN', 'color:green');
      this.statusSub.next('OPEN');
    } else  console.warn(ws.readyState);
  }


}
