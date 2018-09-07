import {Observable, Subject, Subscription} from '../../../../node_modules/rxjs';

export class SocketChannel {
  market: string;
  channel: string;
  id: string;
  ws: WebSocket;
  serverID: string;
  sub:Subject<any> = new Subject();
 /* subscribe(): Subscription{
    return this.sub.asObservable().subscribe;
  }*/

  dispatch(obj: any) {
    this.sub.next(obj);
  }

  setSoket(ws: WebSocket){

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