import {ChannelTrades} from "./channel-trades";
import {Channels, IChannel, ISocketData} from "../socket-models";


export class SoketConnector {

  ws: WebSocket;
  channelsInd: { [index: string]: ISocketData } = {};

  constructor() {

  }

  channels: ISocketData[] = [];
  trades: { [id: number]: { rate: number, amount: number, buy: boolean } };


  updateTrades(data: { type: string, values: number[] }) {

  }

  parseChannelId(data:{ channel: string, chanId: number, symbol: string, pair: string }){
    let base = data.pair.substr(3);
    if(base ==='USD') base = 'USDT';
    let coin = data.pair.substr(0,3);

    return data.channel +'_'+ base +'_'+coin;
  }
  onSubscribed(data: { channel: string, chanId: number, symbol: string, pair: string }) { //{event:"subscribed","channel":"trades","chanId":106,"symbol":"tBTCUSD","pair":"BTCUSD"}

    let id = this.parseChannelId(data);
    let channel: ISocketData = this.channelsInd[id];
    if (!channel) {
      console.error(' no channel for ' +id, data);
    } else {
      channel.init(data);
      this.channels[data.chanId] = channel;
    }

  }

  onUnSubscribed(data:{status:string, chanId:number }){
    let index = this.channels[data.chanId].index;
    this.channels[data.chanId] = this.channels[data.chanId].destroy();
    if(!this.channels[data.chanId]) delete this.channelsInd[index];
  }


  private onMessage(m) {
    let data = JSON.parse(m.data);
    // console.log(data);

    if (data.event) {
      switch (data.event) {
        case 'info':
          this.onInfo(data);
          break;
        case 'subscribed':
          this.onSubscribed(data);
          break;
        case 'unsubscribed':
          this.onUnSubscribed(data);
          break;
        default:
          console.warn('unknown event ', data);
      }

    } else {
      let id = data[0];
      // console.log('ID '+id);
      let channel: ISocketData = this.channels[id];
      if (channel) channel.onData(data);
      else console.warn(' no ID ' + id);
    }

  }

  version = 2;

  onInfo(data: { event: string, version: number }) {
    if (data.version !== this.version) {
      console.warn(' wrong version ' + this.version, data)
    }
    //console.log('info ', data);
  }




  cerateId

  createChannel(index:string,channel:Channels, base:string, coin:string): ISocketData {
    switch (channel) {
      case Channels.TRADES:
        return new ChannelTrades(index, base, coin);
    }
  }


  getChannel(channel:Channels, base: string, coin: string): IChannel {

    let index = channel +'_'+ base + '_'+coin;

    let newChannel:ISocketData;

    if (!this.channelsInd[index]) {
      newChannel = this.createChannel(index, channel,  base, coin);
      this.channelsInd[index] = newChannel;
    }


   this.createSocket((err, ws:WebSocket)=>{
     if(newChannel) newChannel.connect(ws);

   });

    return <IChannel> this.channelsInd[index];
  }

  isOpen = false;
  onOpen=[];

  private createSocket(callBack) {

    if(this.isOpen){
      return callBack(null, this.ws);
    } else this.onOpen.push(callBack);

    if(!this.ws){
      let ws =  new WebSocket('wss://api.bitfinex.com/ws/2');

      ws.onopen = (e) => {
        this.isOpen = true;
        this.onOpen.forEach(function (fn) {
          fn(null, ws);
        });
        console.log(' open bitfinex');
      };

      ws.onclose = (closeEvent) => {
        console.warn ('close bitfinex');
        this.ws = null;

      };
      ws.onmessage = (m) => this.onMessage(m);
      this.ws = ws;
    }







  }

}