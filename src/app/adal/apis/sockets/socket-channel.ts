import {Observable, Subject, Subscription} from '../../../../../node_modules/rxjs';

export class SocketChannel {
  market: string;
  channel: string;
  id: string;
  ws: WebSocket;
  serverID: string;
  sub:Subject<any> = new Subject();
  data$(): Observable<any>{
    return this.sub.asObservable()
  }

  dispatch(obj: any) {
    this.sub.next(obj);
  }

  setSoket(ws: WebSocket){

  }

  hasSubscribers(){
    return this.sub.observers.length;
  }

  unsubscribe(){

  }

  destroy(){
    this.ws = null;
    this.unsubscribe = null;
    this.sub.complete();
    this.sub = null;
  }
}