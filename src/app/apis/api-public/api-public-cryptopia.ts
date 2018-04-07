import {VOBooks, VOMarket, VOOrder, VOTrade} from "../../models/app-models";
import {SOMarketCryptopia} from "../../models/sos";
import {ApiCryptopia} from "../../my-exchange/services/apis/api-cryptopia";
import {Observable} from "rxjs/Observable";
import {HttpClient} from "@angular/common/http";
import {IApiPublic} from "../i-api-public";

export class ApiPublicCryptopia implements IApiPublic{
  constructor(private http:HttpClient){

  }

  downloadBooks(base:string, coin:string):Observable<VOBooks>{

    let url = 'https://www.cryptopia.co.nz/api/GetMarketOrders/{{coin}}_{{base}}/100'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any)=>{
      // console.log(res);
      res = res.Data;

      let buy:VOTrade[] = res.Buy.map(function (item) {
        return{
          amountCoin:+item.Total,
          rate:+item.Price
        }
      });

      let sell:VOTrade[] = res.Sell.map(function (item) {
        return{
          amountCoin:+item.Total,
          rate:+item.Price
        }
      });

      return {
        market:null,
        exchange:null,
        buy:buy,
        sell:sell
      }

    })
  }

  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>{

    let url ='https://www.cryptopia.co.nz/api/GetMarketHistory/{{coin}}_{{base}}/1'.replace('{{base}}', base).replace('{{coin}}', coin);
    console.log(url);
    return this.http.get(url).map((res:any)=>{
      res = res.Data;
      console.log('MarketHistory '+res.length);
      return res.map(function(item) {
        let time = new Date(item.Timestamp *1000);
        return {
          action:item.Type.toUpperCase(),
          isOpen:false,
          uuid:item.Timestamp,
          exchange: 'cryptopia',
          rate:+item.Price,
          amountBase:+item.Total,
          amountCoin:+item.Amount,
          date:time.toUTCString(),
          minutes:time.getMinutes(),
          timestamp:item.Timestamp *1000,
          local:time.toLocaleTimeString()
        };
      });
    });
  }



//////////////////////////////////////////////////////////////////////////////////////MARKETS
  isLoadinMarkets
  downloadTicker():Observable<{[market:string]:VOMarket}>{

      let url = 'https://www.cryptopia.co.nz/api/GetMarkets';
      this.isLoadinMarkets = true;
      console.log(url);
      return this.http.get(url).map((res:any)=>{
        let  result = res.Data;

        let marketsAr: VOMarket[] = [];

        let baseCoins: string[] = [];

       // let selected: string[] = this.getMarketsSelected();
        const ar:any[] = res.Data;

        let indexed:{} = {}
        let bases:string[] = [];
        if(!Array.isArray(ar)){
          console.warn(res);
          return [];
        }
        ar.forEach(function (item:SOMarketCryptopia) {
          let ar:string[] = item.Label.split('/');

          let market:VOMarket = new VOMarket();
          market.base = ar[1];
          if(bases.indexOf(market.base) === -1) bases.push(market.base);
          market.coin = ar[0];

          market.pair =  ar[1] + '_' +  ar[0];

          market.id = item.Label;
          market.exchange = 'cryptopia';

        //  market.Volume = +item.Volume;
          market.Last = item.LastPrice;
          market.High = item.High;
          market.Low = item.Low;
          market.Ask = item.AskPrice;
          market.Bid = item.BidPrice;
          market.BaseVolume = item.BaseVolume;
          market.PrevDay = 0;
          market.OpenBuyOrders = item.BuyVolume;
          market.OpenSellOrders = item.SellVolume;

          indexed[market.base + '_' +  market.coin] = market;
          marketsAr.push(market);

        })

       return indexed;

      });


  }

  static mapMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    bases:string[],
    selected:string[]
  ):number{

    let ar:any = result;
    //console.log(ar);
    ar.forEach(function (item:SOMarketCryptopia) {
      let ar:string[] = item.Label.split('/');

      let market:VOMarket = new VOMarket();
      market.base = ar[1];
      if(bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[0];

      market.pair =  ar[1] + '_' +  ar[0];
      market.selected = selected.indexOf( market.pair) !==-1;

      market.id = item.Label;
      market.exchange = 'cryptopia';

      // market.Volume = +item.Volume;
      market.Last = item.LastPrice;
      market.High = item.High;
      market.Low = item.Low;
      market.Ask = item.AskPrice;
      market.Bid = item.BidPrice;
      market.BaseVolume = item.BaseVolume;
      market.PrevDay = 0;
      market.OpenBuyOrders = item.BuyVolume;
      market.OpenSellOrders = item.SellVolume;

      indexed[market.pair] = market;
      marketsAr.push(market);

    })

    return result.length;
  }
}
