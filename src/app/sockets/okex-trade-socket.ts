
import * as pako from 'pako';
import * as gzip from 'gzip';
import {SocketBase} from "./soket-base";


export class OkexTradesSocket extends SocketBase {

  hb: number;
  socketUrl = 'wss://real.okcoin.com:10440/websocket';
  exchange = 'okex';

  constructor() {
    super();
    //const ar = market.split('_');


  }

  async createChannelId(channel, market): Promise<string> {

    console.log('createChannelId', channel, market);

    const id = Date.now();
    const params = {
      event:'addChannel',
      channel:'ok_sub_spot_btc_usd_deals'
    };

    this.send(JSON.stringify(params));



    return Promise.resolve(this.exchange + market);
  }

  onMessage(m) {

    console.log(m.data)


    //let blob = m.data;

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


}
