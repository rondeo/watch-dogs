
import {BehaviorSubject, Observable} from '../../../../node_modules/rxjs';
import {IChannel} from '../../sockets/soket-base';
import {SocketChannel} from './socket-channel';
import {reject} from 'q';


export interface ISocketData {
  data: any;
  exchange: string;
  market: string;
  channel: string;
}

export abstract class SocketBase {

  // sub: Subject<ISocketData> = new Subject<ISocketData>();

  constructor() {

  }
  ws: WebSocket;
  abstract socketUrl: string;
  hb: number;
  exchange: string;
  market: string;
  marketIDs = {};
  statusSub: BehaviorSubject<string> = new BehaviorSubject('CLOSED');

  HB: string;
  marketsMap: { [marketId: string]: string } = {};

  private intevalHB;
  channels = {};
  serverChannels = {};

  /*startHB() {
    clearInterval(this.intevalHB);
    this.intevalHB = setInterval(() => {
      this.checkState();
    }, 60000);
  }*/

  onOpen(evt, resolve, reject) {
    const ws: WebSocket = <WebSocket>evt.currentTarget;
    console.log('%c ' + this.exchange + ' OPEN ' + ws.url, 'color:green');
    if (ws.readyState === ws.OPEN) {
      resolve(ws);
    } else reject();
  }

  onClose(evt, ws: WebSocket) {
    console.warn(this.exchange + ' CLOSE');
  }

  onError(err) {
    console.warn(err);
  }

  reconnect() {
    /* this.ws = null;
     let channelsAr: SocketChannel[] = Object.values(this.subscribers);
     channelsAr.forEach((item) => {
       this.createChannel(item.channel, item.market, item.sub);
     })*/

  }

  // subscribers: { [id: string]: IChannel } = {};


  async getSocket(chanel: SocketChannel): Promise<WebSocket> {
    if (this.ws) return Promise.resolve(this.ws);
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(this.socketUrl);
      ws.addEventListener('message', (evt) => this.onMessage(evt));
      ws.addEventListener('open', (evt) => this.onOpen(evt, resolve, reject));
      ws.addEventListener('close', (evt) => this.onClose(evt, ws));
      ws.addEventListener('error', (evt) => this.onError(evt));
    });
  }


  abstract async subscribeForChannel(chanel: SocketChannel): Promise<any>;

  abstract onMessage(m: any): void;
  getChannel(channel: string, market: string): SocketChannel {
    const id = channel + '=' + market;
    if (this.channels[id]) return this.channels[id];
    const ch = new SocketChannel();
    ch.id = id;
    ch.channel = channel;
    ch.market = market;
    this.channels[id] = ch;
    this.subscribeForChannel(ch).then(socket => {

    });

    return ch;
  }

  subscribe(chanel: string, market: string): SocketChannel {
    return this.getChannel(chanel, market);
  }

 /* unsubscribeFromTrades(market: string) {
    const ch = this.channels['trades' + '=' + market];
    if (ch) {
      ch.unsubscribe();
      ch.destroy();
    }

  }*/

  subscribeForTrades(market: string): SocketChannel {
    return this.subscribe('trades', market);
  }

  subscribeForBooks(market: string) {
    return this.subscribe('books', market);
  }

  subscribeForKline(market: string) {
    return this.subscribe('kline_5m', market);
  }

  dispatch(channelID, market, data): boolean {
    const channel: SocketChannel = this.channels[channelID + '=' + market];
    if (channel && channel.hasSubscribers()) {
      channel.dispatch(data);
      return true;
    }
    if (channel)  delete this.channels[channel.id];
    return false;
  }
  //  isQ: boolean;

  /* send(params) {
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
     } else console.warn(ws.readyState);
   }*/


}
