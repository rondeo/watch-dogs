export interface IChannel{

  pair:string;
  symbol:string;
  getData():any;
  subscribe(event:ChannelEvents, callBack:(channel:IChannel)=>void);
}

export interface ISocketData extends IChannel{
  onData(data);
  init(data);
}


export enum ChannelEvents{
  CONNECTED,
  DISCONNECTED,
  FIRST_DATA,
  DATA
}
export class ChannelTrades implements  ISocketData{

  channel = 'trades';
  symbol:string;
  pair:string;
  chanId:number;

  // data:{[index:number]:{id:number,timestamp:number, rate:number, amount:number}} = {};
  dataAr:{id:number,timestamp:number, rate:number, amount:number}[] ;
  te:{[id:number]:number[]} = {};

  listeners:Function[][] = [];
  constructor(private params:{event:string, channel:string, symbol:string}){
    //console.warn(params);

    if(params.channel !== this.channel) console.warn('  wrong  class channel'+ this.channel, params);
    this.symbol = params.symbol;

  }

  private dispatchEvent(event:string){

  }

  subscribe(event:ChannelEvents, callBack:Function){
    if(!this.listeners[event])this.listeners[event] = [];
    this.listeners[event].push(callBack);
  }

  getData(){
    return this.dataAr
  }

  init(data:{event:string,channel:string,chanId:16,symbol:string,pair:string}){//event:"subscribed",channel:"trades",chanId:16,"symbol":"tBTCUSD","pair":"BTCUSD
    if(data.event ==='subscribed'){
      if(data.channel !== this.channel || this.symbol !== this.symbol){
        console.warn('wrong channel this is '+ this.channel + ' symbol '+ this.symbol, data);
      };

      this.chanId = data.chanId;
      this.pair = data.pair;
      if(this.listeners.length){
        let channel = this;
        this.listeners[ChannelEvents.CONNECTED].forEach(function (item) {
          item(channel);
        });
        return true;
      } else return false;

    }
  }

  private updateData(data, isReal){
    let load:number[] = data[2];
    if(isReal && this.te[load[0]]){

      this.dataAr.push(
        {
          id:load[0],
          timestamp:load[1],
          amount:load[2],
          rate:load[3]
        }
      );

    }else  this.te[load[0]] = load;

    // console.log(this.pair +' data '+ this.dataAr.length)
  }

  private initData(data:number[][][]) {
    let res = {};
    let channelID = data[0];
    this.dataAr =  data[1].map(function (item: number[]) {
      return {
        id:item[0],
        timestamp:item[1],
        amount:item[2],
        rate:item[3]
      };
    });

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
    console.log('hb ' + this.pair);
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