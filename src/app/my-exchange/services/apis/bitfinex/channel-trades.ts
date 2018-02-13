import {ChannelEvents, ISocketData} from "../socket-models";


export class ChannelSubscription{
  constructor(
  private callBack:Function,
  private channel:ISocketData,
  private event:ChannelEvents
){}

unsubscribe(){
    this.channel.removeListener(this.event, this.callBack);
}
}

export class ChannelTrades implements  ISocketData{

  channel = 'trades';
  pair:string;
  chanId:number;
  ws:WebSocket;
  isConnected = false;
  isConnecting = false;
  LIMIT = 300;
  market:string;

  // data:{[index:number]:{id:number,timestamp:number, rate:number, amount:number}} = {};
  dataAr:{uuid:number,timestamp:number, rate:number, amountCoin:number}[] ;
  te:{[id:number]:number[]} = {};

  listeners:Function[][] = [];
  constructor(public index:string, public base:string, public coin:string){
    if(base ==='USDT')this.market = 't'+coin+'USD';
    else this.market = 't'+coin+base
    //console.warn(params);
  }

  disconnect(){
    let params =  {
      event:"unsubscribe",
      chanId:this.chanId
    }
   // console.warn(params);
    this.ws.send(JSON.stringify(params));
    this.isConnected = false;
  }

  destroy():ISocketData{
    if(this.isConnecting || this.isConnected) return this;
    console.log(' destroying ' + this.index);
    this.ws = null;
    this.listeners = null;
    this.dataAr = null;
    return null;
  }

  connect(ws:WebSocket){
    this.ws = ws;
    //console.warn(ws.CONNECTING);
    this.isConnecting = true;
    let params =  {
      event:"subscribe",
      symbol:this.market,
      channel:this.channel

    };
    console.warn(params);
   ws.send(JSON.stringify(params));
  }

  removeListener(event:ChannelEvents, callBack:Function){
    let ar = this.listeners[event];
    if(!ar) return;
    let ind = ar.indexOf(callBack);
    if(ind === -1) console.warn(' no function in listeners');
    else {

      ar.splice(ind, 1);
     // console.log(event + ' removing ind: '+ind + ' left '+ar.length)
    }
    if(this.listeners[ChannelEvents.DATA].length ==0) {
      console.log(' no listeners fo data disconnecting ' + this.index);
      this.disconnect();
    }
  }


  subscribe(event:ChannelEvents, callBack:Function):ChannelSubscription{
    if(!this.listeners[event])this.listeners[event] = [];
    this.listeners[event].push(callBack);
    return new ChannelSubscription(callBack, this, event);
  }

  getData(){
    return this.dataAr
  }

  init(data:{event:string, channel:string, chanId:number ,symbol:string, pair:string}){//event:"subscribed",channel:"trades",chanId:16,"symbol":"tBTCUSD","pair":"BTCUSD
    this.isConnecting = false;
    if(data.event ==='subscribed'){
      console.log('subscribed ' + this.index);
      if(data.channel !== this.channel || data.symbol !== this.market){
        console.warn('wrong channel this is '+ this.channel + ' symbol '+ this.market, data);
      };

      this.isConnected = true;
      this.chanId = data.chanId;
      this.pair = data.pair;
      if(this.listeners.length){
        let channel = this;
        if(this.listeners[ChannelEvents.CONNECTED]) this.listeners[ChannelEvents.CONNECTED].forEach(function (item) { item(channel); });
        return true;
      } else return false;

    }
  }

  private updateData(data, isReal){
    let load:number[] = data[2];
    if(isReal && this.te[load[0]]){

      let newData = {
        uuid:load[0],
        timestamp:load[1],
        amountCoin:Math.abs(load[2]),
        action:load[2] < 0?'SELL':'BUY',
        rate:load[3]
      }
      if(this.dataAr.length > this.LIMIT)this.dataAr.pop();
      this.dataAr.unshift(newData);
     if(this.listeners && this.listeners[ChannelEvents.DATA]) this.listeners[ChannelEvents.DATA].forEach(function (item) {   item(newData);  });

    }else  this.te[load[0]] = load;

    // console.log(this.pair +' data '+ this.dataAr.length)
  }

  private initData(data:number[][][]) {

    let channelID = data[0];

      let res = data[1].map(function (item: number[]) {
      return {
        uuid:item[0],
        timestamp:item[1],
        amountCoin:Math.abs(item[2]),
        action:item[2]<0?'SELL':'BUY',
        rate:item[3]
      };
    });

    this.dataAr = res;

    if(this.listeners && this.listeners[ChannelEvents.FIRST_DATA]) this.listeners[ChannelEvents.FIRST_DATA].forEach(function (item) {   item(res);  });

    /* data[1].forEach(function (item: number[]) {
         res[item[0]] = {
             id:item[0],
             timestamp:item[1],
             amount:item[2],
             rate:item[3]
         };
     });
*/
    //this.data = res;

    // console.log(this.pair +' initdata '+ Object.keys(this.data).length, data)
    //console.log('initData', data);
  }

  prevHB = 0;
  private onHeartBeat(data){
    if(!this.prevHB) this.prevHB = Date.now();
    let id = this.channel+'_'+this.base +'_'+this.coin;
    if(this.listeners[ChannelEvents.HEART_BEAT]) this.listeners[ChannelEvents.HEART_BEAT].forEach(function (fn) { fn(id) });
    //console.log('hb ' + this.pair);
  }

  onData(data){
    if(data[0] !== this.chanId){
      console.warn(' not my ID ', data);
      return;
    }
    // let load:number[] = data[2];
    if(data[1] ==='te')this.updateData(data, false);
    else if(data[1] ==='tu') this.updateData(data, true);
    else if(data[1] ==='hb') this.onHeartBeat(data);
    else this.initData(data);

  }

}