
import { HubConnection } from '@aspnet/signalr';


export class BittrexSocket {
  private ws;
  url:string;

  constructor() {
    const hub = new HubConnection('https://socket.bittrex.com/signalr');

    hub.on('Send', (data: any) => {
      const received = `Received: ${data}`;
     console.log(data);
    });

    hub.start()
      .then(() => {
        console.log('Hub connection started')
      })
      .catch(() => {
        console.log('Error while establishing connection')
      });
   // this.init(ws);
  }
  addEventListener(type:string, cb){

  }

  onclose(){

  }

  init(wsclient){

    const opts = {
      baseUrl: 'https://bittrex.com/api/v1.1',
      baseUrlv2: 'https://bittrex.com/Api/v2.0',
      websockets_baseurl: 'wss://socket.bittrex.com/signalr',
      websockets_hubs: ['CoreHub'],
      apikey: 'APIKEY',
      apisecret: 'APISECRET',
      verbose: false,
      cleartext: false,
      inverse_callback_arguments: false,
      websockets: {
        autoReconnect: true,
      },
      requestTimeoutInSeconds: 15,
    };

    wsclient.serviceHandlers = {

      bound: function() {
       console.log('bound');
      },
      connectFailed: function(error) {
         console.log('Websocket connectFailed: ');
      },
      disconnected: function() {
       console.log('disconnected');
      },
      onerror: function(error) {
        console.log('Websocket onerror: ', error);
      },
      bindingError: function(error) {
        console.log('Websocket bindingError: ');
      },
      connectionLost: function(error) {
        console.log('Connection Lost: ');
      },
      reconnecting: function(retry) {
        return true;
      },
      connected: function() {
         console.log('Websocket connected');
      },
    };

  }
}
