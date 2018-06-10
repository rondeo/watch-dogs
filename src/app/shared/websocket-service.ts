
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {Observer} from "rxjs/Observer";
import {Subject} from "rxjs/Subject";


export interface VOBuys{
  Quantity:number;
  Rate:number;
  Type:number;
}
export interface VOFills {
  OrderType: string;
  Quantity: number;
  Rate: number;
  TimeStamp: string;
}

export interface VOMarketData{
  MarketName:string;
  ext:string;
  Nonce:number;
  Buys:VOBuys[];
  Sells:VOBuys[];
  Fills:VOFills[];

}

export interface Socket {
  on(event: string, callback: (data: any) => void );
  emit(event: string, data: any);
}

declare var io : {
  connect(url: string, options?:any): Socket;
};

@Injectable()
export class WebsocketService {

  socket: Socket;
  observer: Observer<any>;
  isConnected:Subject<boolean>;
  connections:{[id:string]:any} = {};
  marketsDataSub:Subject<VOMarketData>;

  constructor(){
    this.isConnected = new Subject();
    this.marketsDataSub = new Subject();
  }

  getQuotes() : Observable<number> {
    this.socket = io.connect('/');

    this.socket.on('welcome', (res) => {
      console.log(res);
      if(res.id){
        this.connections[res.id] = res;
        this.isConnected.next(true)
      }

     // this.observer.next(res);
    });

    this.socket.on('data', (res) => {
      console.log(res);
      this.observer.next(res);
    });
    this.socket.on('bittrex-data', (res) => {
      //console.log(res);
      res.evt = 'bittrex-data';
      this.marketsDataSub.next(res);
     // this.observer.next(res);
    });

    this.socket.on('test', (res) => {
      console.log(res);
    });

    return this.createObservable();
  }

  sendMessage(message:string[]){
    console.log('bittrex ', message);

    message = message.map(function (item) {
      return item.replace('_', '-')
    })
    this.socket.emit('bittrex', message);
  }

  createObservable() : Observable<number> {
    return Observable.create((observer: Observer<any>) => {
      this.observer = observer;
    });
  }

  private handleError(error) {
    console.error('server error:', error);
    if (error.error instanceof Error) {
      let errMessage = error.error.message;
      return Observable.throw(errMessage);
    }
    return Observable.throw(error || 'Socket.io server error');
  }

}

/*




import { Injectable } from '@angular/core';
import * as Rx from 'rxjs/Rx';

@Injectable()
export class WebsocketService {
  constructor() { }

  private url = 'ws://localhost:5000/'
  private subject: Rx.Subject<MessageEvent>;

  public connect(): Rx.Subject<MessageEvent> {
    if (!this.subject) {

      this.subject = this.create(this.url);
      console.log("Successfully connected: " + this.url);
    }
    return this.subject;
  }

  private create(url): Rx.Subject<MessageEvent> {

    let ws = new WebSocket(url);

    let observable = Rx.Observable.create(
      (obs: Rx.Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = obs.error.bind(obs);
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
      })

    let observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    }
    return Rx.Subject.create(observer, observable);
  }

}
*/


/*
import { Observable, Subscribable } from 'rxjs/Observable'
import { AnonymousSubscription } from 'rxjs/Subscription'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

export interface Connection {
  connectionStatus: Observable<number>,
  messages: Observable<string>,
}

export interface IWebSocket {
  close()
  send(data: string | ArrayBuffer | Blob)
  onopen?: (OpenEvent: any) => any
  onclose?: (CloseEvent: any) => any
  onmessage?: (MessageEvent: any) => any
  onerror?: (ErrorEvent: any) => any
}

export type WebSocketFactory = (url: string, protocols?: string | string[]) => IWebSocket

const defaultWebsocketFactory = (url: string, protocol?: string): IWebSocket => new WebSocket(url, protocol)

export default function connect(
  url: string,
  input: Subscribable<string>,
  protocols?: string | string[],
  websocketFactory: WebSocketFactory = defaultWebsocketFactory,
): Connection {

  const connectionStatus = new BehaviorSubject<number>(0)

  const messages = new Observable<string>(observer => {
    const socket = websocketFactory(url, protocols)
    let inputSubscription: AnonymousSubscription

    let open = false
    const closed = () => {
      if (! open)
        return

      connectionStatus.next(connectionStatus.getValue() - 1)
      open = false
    }

    socket.onopen = () => {
      open = true
      connectionStatus.next(connectionStatus.getValue() + 1)
      inputSubscription = input.subscribe(data => {
        socket.send(data)
      })
    }

    socket.onmessage = (message: MessageEvent) => {
      observer.next(message.data)
    }

    socket.onerror = (error: ErrorEvent) => {
      closed()
      observer.error(error)
    }

    socket.onclose = (event: CloseEvent) => {
      closed()
      if (event.wasClean)
        observer.complete()
      else
        observer.error(new Error(event.message))
    }

    return () => {
      if (inputSubscription)
        inputSubscription.unsubscribe()

      if (socket) {
        closed()
        socket.close()
      }
    }
  })

  return { messages, connectionStatus }
}
*/
