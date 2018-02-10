import {ChannelTrades, IChannel, ISocketData} from "./channel-trades";


export class SoketConnector {
  static CH_TRADES = 'trades';
  static CH_BOOKS = 'books';
  static CH_TICKER = 'ticker';


  ws: WebSocket;

  constructor() {

  }

  channels: ISocketData[] = [];
  trades: { [id: number]: { rate: number, amount: number, buy: boolean } };


  updateTrades(data: { type: string, values: number[] }) {

  }

  onSubscribed(data: { channel: string, chanId: number, symbol: string, pair: string }) { //{event:"subscribed","channel":"trades","chanId":106,"symbol":"tBTCUSD","pair":"BTCUSD"}

    let channel: ISocketData = this.subscriptions[data.channel + data.symbol];
    if (!channel) {
      console.error(' no channel for ', data);
    } else {
      channel.init(data);
      this.channels[data.chanId] = channel;
    }

  }


  onMessage(m) {
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


  subscriptions: { [index: string]: ISocketData } = {};


  createChannel(type: string, options): ISocketData {
    switch (type) {
      case 'trades':
        return new ChannelTrades(options);
    }
  }

  subscribe(channel: string, base: string, coin: string): IChannel {
    let callBack = function (res) {

    };

    let symbol = 't' + coin + base;
    let params = {
      event: "subscribe",
      channel: channel,
      symbol: symbol
    };
//if(!this.subscriptions[channe ])
    console.log(params);
    this.ws.send(JSON.stringify(params));

    if (!this.subscriptions[channel + symbol]) this.subscriptions[channel + symbol] = this.createChannel(channel, params);

    return <IChannel> this.subscriptions[channel + symbol];
  }

  createSocket(callBack) {
    let ws = new WebSocket('wss://api.bitfinex.com/ws/2');
    ws.onopen = (e) => {
      callBack(null, e);
      console.log(' open ');
    };

    ws.onclose = (closeEvent) => {
      console.log('close ')

    };

    ws.onmessage = (m) => this.onMessage(m);
    this.ws = ws;

  }

}