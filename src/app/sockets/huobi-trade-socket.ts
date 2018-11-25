
import * as pako from 'pako';

import * as JSZip from 'jszip';

import {SocketBase} from "./soket-base";


export class HuobiTradesSocket extends SocketBase {

  hb: number;
  exchange = 'huobi'
  socketUrl = 'wss://api.huobi.pro/ws';

  constructor() {
  super();

  }


  onMessage(m) {

    console.log(m)
    //let blob = m.data;

    var reader = new FileReader();
    reader.onload = function() {
      console.log(reader.result);
      let res =  pako.inflate(reader.result);
      console.log(res);
    }
    reader.readAsBinaryString(m.data)

  // let res = unzip.Parse(m.data);


   // console.log(res);



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

  subscriptions :any ={};

  async createChannelId(channel, market): Promise<string> {

    const id = Date.now();
    let params = {
      req: 'market.' + market.split('_').reverse().join('').toLocaleLowerCase() + '.trade.detail',
      id: id
    };

    this.send(JSON.stringify(params));

    return Promise.resolve(this.exchange + market);
  }

}
