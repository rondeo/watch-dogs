export interface IChannel{

  pair:string;
  market:string;
  getData():any;
  subscribe(event:ChannelEvents, callBack:(data:any)=>void);
}

export interface ISocketData extends IChannel{
  index:string;
  onData(data);
  init(data);
  connect(ws:WebSocket);
  destroy():ISocketData;
  removeListener(event:ChannelEvents, callBack:Function):void;
}


export enum ChannelEvents{
  CONNECTED,
  DISCONNECTED,
  FIRST_DATA,
  DATA,
  HEART_BEAT
}


export enum Channels{
  TRADES = 'trades',
  BOOKS = 'books',
  TICKER = 'ticker'
}


