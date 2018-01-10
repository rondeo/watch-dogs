import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';

//import websocketConnect from '../shared/websocket-service'



const CHAT_URL = 'ws://localhost:5000/';

export interface Message {
  author: string,
  message: string
}

@Injectable()
export class ChatService {
  public messages: Subject<string>;

  constructor(



  //  wsService: WebsocketService
  ) {



    /*this.messages = <Subject<string>>wsService
      .connect(CHAT_URL)
      .map((response: MessageEvent) => {
        console.log(response)
       // let data = JSON.parse(response.data);
        return <any>response.data;
      });
      */
  }


  connect(){

   /* const input = new Subject<string>();

    const { messages, connectionStatus } = websocketConnect(CHAT_URL, input);

    console.log(connectionStatus)
*/

  }



}