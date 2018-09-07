import {Subject} from "rxjs/Subject";
import {SocketBase} from "./soket-base";
import {SocketChannel} from './socket-channel';


export class BinanceTradesSocket extends SocketBase {
  exchange = 'binance';
  socketUrl = 'wss://stream.binance.com:9443/ws/';
  //HB = '.';

  constructor() {
    super();
  }

  marketsIds:any ={};
  sockets:WebSocket[] = [];

  async createSocket(channel: SocketChannel):Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) =>{
      const marketId = channel.market.split('_').reverse().join('').toLocaleLowerCase();
      // this.marketsIds[marketId] = market;
      const suffix = marketId +'@' + channel.channel.slice(0,-1);

      const ws = new WebSocket(this.socketUrl + suffix);

      const onFirstMessage = function(msg){
        let data: any = JSON.parse(msg.data);
       // console.log(data);
       // console.log(channel);

        if(data.e + 's' === channel.channel && data.s ===  channel.market.split('_').reverse().join(''))  {
          const out = {
            exchange:'binance',
            market: channel.market,
            amountCoin:data.m? -data.q:+data.q,
            rate: +data.p,
            timestamp:+data.T,
            uuid: +data.b
          };
          channel.dispatch(out);
        }
      };

      ws.addEventListener('message',onFirstMessage);
      ws.addEventListener('open', (evt) => {
        // console.log(evt);
        channel.unsubscribe = function(){
          console.warn(' unsubscribe ', channel);
          ws.close();
        }
        console.log(ws.readyState, ws.OPEN);
        if (ws.readyState === ws.OPEN) {

          resolve(ws);
        } else reject();
      });
      ws.addEventListener('close', (evt) => {
        console.log('close  ', evt)
      });
      ws.addEventListener('error', (evt) => {
        console.log('error', evt)
        reject();
      });
    });

  }

  unsubscribeChannel(channel: SocketChannel){
    channel.unsubscribe();
    channel.destroy();

  }

  async subscribeForChannel(channel: SocketChannel):Promise<any>{
    console.log('createChannelId', channel);
    const socket = await this.createSocket(channel);
    this.sockets.push(socket);
    return socket
  }


  /*onMessage(m: MessageEvent) {

    let dataM: any = JSON.parse(m.data);

   console.log(dataM);

    let channel = dataM.e;
    const marketId = dataM.s.toLocaleLowerCase();
    let market = this.marketsIds[marketId];

    if (dataM.e === 'trade') {
      channel = 'trades';
      const data = {
        amountCoin:dataM.m? -dataM.q:+dataM.q,
        rate: +dataM.p,
        timestamp:+dataM.T,
        uuid: +dataM.b
      };

      const id = this.exchange + channel + market;
      this.dispatch(id, data);
    }

  }*/

}
