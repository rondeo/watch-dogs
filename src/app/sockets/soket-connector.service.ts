import { Injectable } from '@angular/core';
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {BitfinexTradesSocket} from "./bitfinex/bitfinex-trades-socket";


export interface ISocketChannel{
  channel:string;
  market:string;
  sub:Subject<any>;
}

interface MySoket{
  socket:WebSocket;
  exchange:string;
  channnels:ISocketChannel[]
}

export interface IVOTrade{
  amountCoin:number;
  rate:number;
  timestamp:number;
  uuid:string
}

@Injectable()
export class SoketConnectorService {

  sockets:{[exchange:string]:MySoket} = {};
  constructor() { }


  getSubscription(exchange:string, chanel:string, market:string ):Observable<any>{
    if(!this.sockets[exchange]){
      let ws = this.creataSoket(exchange);
      let ch = this.createChannel(ws, exchange, chanel, market);
      this.sockets[exchange] = {
        socket:ws,
        exchange:exchange,
        channnels :[ch]
      }
      return ch.sub.asObservable()
    }else{
      const exists: ISocketChannel =  this.sockets[exchange].channnels.find(function (item) {
       return item.channel === chanel && item.market === market;
      });
      if(exists) return exists.sub.asObservable();
      else {
        const ch:ISocketChannel = this.createChannel(this.sockets[exchange].socket, exchange, chanel, market);
        this.sockets[exchange].channnels.push(ch);
        return ch.sub.asObservable();
      }
    }
  }

  unsubscribe(exchange:string, chanel:string, market:string){

  }

  private createChannel(ws:WebSocket, exchange:string, chanel:string, market:string):ISocketChannel{

    switch (exchange + chanel) {
      case 'bitfinextrades':
        return new BitfinexTradesSocket(chanel, market, ws)
    }
  }

  private creataSoket(exchange:string): WebSocket {
    switch (exchange) {
      case 'bitfinex':
        return new WebSocket('wss://api.bitfinex.com/ws/2');
    }
    return null;


  }
}
