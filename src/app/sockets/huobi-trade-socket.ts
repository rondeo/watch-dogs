import {Subject} from "rxjs/Subject";
import {ISocketChannel} from "./soket-connector.service";
import * as pako from 'pako';
import * as gzip from 'gzip';


export class HuobiTradesSocket implements ISocketChannel {
  private version = 2;
  private chanId = 0;
  private hb: number;
  private exchange = 'huobi';
  private _market: string;
  sub: Subject<any> = new Subject<any>();
  private ws: WebSocket

  constructor(public channel: string, public market: string) {
    //const ar = market.split('_');
    this._market = market;

  }

  setSocket(ws: WebSocket) {
    this.ws = ws;
    ws.onmessage = (msg) => this.onMessage(msg);
    setTimeout(() => this.connect(), 1000);
  }

  private initData(data: { currencyPair: string, aordersBook: any[] }) {
    if (data.currencyPair !== this._market) {
      console.warn(' not my channel');
      return;
    }
    const exchange = this.exchange;
    const market = this.market;
    const channel = this.channel;
    // this.sub.next({data, exchange, market, channel})

  }

  private onMessage(m) {

    console.log(m)
    //let blob = m.data;

   let res = pako.inflate(m.data, { to: 'string' });
    console.log(res);

   /* var reader = new FileReader();
    reader.addEventListener("loadend", function(res) {

      console.log(reader.result);
     // var result = pako.inflate(reader.result);
     // console.log(result);
      // reader.result contains the contents of blob as a typed array
    });
    reader.readAsBinaryString(blob);*/
   //

   // console.log('result ', result);
   // let dataM: any = JSON.parse(m.data);

     // console.log(dataM);


  /*  if (dataM.length === 1) {
      this.hb = Date.now();
      this.ws.send('.');
      console.log(this.exchange + ' HB')
      return
    }

    if (dataM.e === 'trade') {
      const data = {
        amountCoin: dataM.m ? +dataM.q : -dataM.q,
        rate: +dataM.p,
        timestamp: +dataM.T,
        uuid: +dataM.b
      }
      const exchange = this.exchange;
      const market = this.market;
      const channel = this.channel;
      this.sub.next({data, exchange, market, channel})

    }*/


  }

  id:number;
  private connect() {
    const id = Date.now();
    this.id = id;
    let params = {
      req: 'market.' + this.market.split('_').reverse().join('').toLocaleLowerCase() + '.trade.detail',
      id: id
    };

    console.log(this.ws);
    console.warn(this.ws.readyState);
    if (this.ws.readyState === this.ws.CLOSING) {
      console.log('CLOSING');

    } else if (this.ws.readyState === this.ws.CONNECTING) {
      console.log('CONNECTING');
      setTimeout(() => this.connect(), 1000);

    } else if (this.ws.readyState === this.ws.CLOSED) {
      console.log('CLOSED');

    } else if (this.ws.readyState === this.ws.OPEN) {
      console.log(params);
      this.ws.send(JSON.stringify(params));

    } else {
      setTimeout(() => this.connect(), 1000);
    }

  }
}
