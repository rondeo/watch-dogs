import {VOMarket, VOMarketCap} from '../models/app-models';
import * as _ from 'lodash';
import {
  SOMarketYobit, SOMarketLiveCoin, SOMarketPoloniex, SOMarketBittrex, SOMarketHitbtc,
  SOMarketCryptopia, SOMarketNovaExchange, SOMarketCoinExchange, SOCurrencyCoinexchange, SOMarketExmo, SOMarketBitz,
  SOMarketCoinnone, SOMarketBitsane, SOMarketBithumb, SOMarketEtherdelta
} from '../models/sos';
import {VOMCAgregated} from '../shared/models';


interface BitfinexMarket{
  ask:string;
  bid:string;
  high:string;
  last_price:string;
  low:string;
  mid:string;
  timestamp:string;// "1508021334.6208634"
  volume:string;// "18701.70895159"
}





export class Mappers{

  static etherdeltaMarkets(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}) {


    // console.log('bitsaneMarkets ', reports);


    for (let str in result) {
      let item: SOMarketEtherdelta = result[str];
      if(typeof item ==='object'){
        let market: VOMarket = new VOMarket();

        let ar = str.split('_');

        market.base = ar[0].toUpperCase();
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.coin = ar[1].toUpperCase();
        market.pair = market.base + '_' + market.coin;
        market.id = str;
        market.exchange = 'etherdelta';


       // market.Volume = +item.quoteVolume || 0;
        market.BaseVolume = +item.baseVolume|| 0;
        market.Last = +item.last;
        market.High = 0;
        market.Low = 0;
        market.Ask = +item.ask;
        market.Bid = +item.bid;
        market.PrevDay = market.Last * +item.percentChange;

        let mcBase = marketCap[market.base];
        let basePrice = mcBase ? mcBase.price_usd : 0;
        let mc = marketCap[market.coin];

        Mappers.mapDisplayValues2(market, basePrice, mc);

        marketsAr.push(market);



      }


    }
  }




  static bitsaneMarkets(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}) {


    // console.log('bitsaneMarkets ', reports);


    for (let str in result) {
      let item: SOMarketBitsane = result[str];
      if(typeof item ==='object'){
        let market: VOMarket = new VOMarket();

        let ar = str.split('_');

        market.base = ar[0].toUpperCase();
        if (bases.indexOf(market.base) === -1) bases.push(market.base);
        market.coin = ar[1].toUpperCase();
        market.pair = market.base + '_' + market.coin;
        market.id = str;
        market.exchange = 'bitsane';


        // market.Volume = +item.quoteVolume || 0;
        market.BaseVolume = +item.baseVolume|| 0;
        market.Last = +item.last;
        market.High = +item.high24hr;
        market.Low = +item.low24hr;
        market.Ask = +item.lowestAsk;
        market.Bid = +item.highestBid;
        market.PrevDay = market.Last * +item.percentChange;

        let mcBase = marketCap[market.base];
        let basePrice = mcBase ? mcBase.price_usd : 0;
        let mc = marketCap[market.coin];

        Mappers.mapDisplayValues2(market, basePrice, mc);

        marketsAr.push(market);



      }


    }
  }


  static bithumbMarkets(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}) {


   // console.log('bithumbeMarkets ', reports);
    result = result.data
    bases.push('USDT')

    for (let str in result) {
      let item: SOMarketBithumb = result[str];
      if(typeof item ==='object'){
        let market: VOMarket = new VOMarket();

        market.base = 'USDT';
        market.coin = str.toUpperCase();
        market.pair = market.base + '_' + market.coin;
        market.id = str;
        market.exchange = 'bithumb';

       // market.Volume = +item.volume_1day || 0;
        market.BaseVolume = +item.volume_1day  * +item.average_price;
        market.Last = +item.closing_price;
        market.High = +item.max_price;
        market.Low = +item.min_price;
        market.Ask = +item.buy_price;
        market.Bid = +item.sell_price;
        market.PrevDay = +item.average_price;

        let basePrice = 1;
        let mc = marketCap[market.coin];

        Mappers.mapDisplayValues2(market, basePrice, mc);

        marketsAr.push(market);
      }


    }
  }

  static coinoneMarkets(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}) {


   // console.log('coinoneMarkets ', reports);
    bases.push('USDT')

    for (let str in result) {
      let item: SOMarketCoinnone = result[str];
      if(typeof item ==='object'){
        let market: VOMarket = new VOMarket();

        market.base = 'USDT';
        market.coin = str.toUpperCase();
        market.pair = market.base + '_' + market.coin;
        market.id = str;
        market.exchange = 'coinone';

       // market.Volume = +item.volume || 0;
        market.BaseVolume =  +item.volume * +item.last;
        market.Last = +item.last;
        market.High = +item.high;
        market.Low = +item.low;
        market.Ask = +item.first;
        market.Bid = 0;
        market.PrevDay = +item.yesterday_last;

        let basePrice = 1;
        let mc = marketCap[market.coin];

        Mappers.mapDisplayValues2(market, basePrice, mc);

        marketsAr.push(market);



      }


    }
  }

  static bitzMarkets(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}) {

    result = result.data;
    for (let str in result) {
      let item: SOMarketBitz = result[str];
      let market: VOMarket = new VOMarket();

      let ar = str.split('_');

      market.base = ar[1].toUpperCase();
      if (bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[0].toUpperCase();
      market.pair = market.base + '_' + market.coin;
      market.id = str;
      market.exchange = 'bitz';

     // market.Volume = +item.vol || 0;
      market.BaseVolume =+item.vol *  +item.last;
      market.Last = +item.last;
      market.High = +item.high;
      market.Low = +item.low;
      market.Ask = +item.buy;
      market.Bid = +item.sell;

      let mcBase = marketCap[market.base];
      let basePrice = mcBase ? mcBase.price_usd : 0;
      let mc = marketCap[market.coin];

      Mappers.mapDisplayValues2(market, basePrice, mc);

      marketsAr.push(market);

    }
  }


  static exmoMarkets(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}){

    for(let str in result){
      let item:SOMarketExmo = result[str];
      let market:VOMarket = new VOMarket();

      let ar = str.split('_');
      market.base = ar[1];
      if(bases.indexOf(market.base) === -1) bases.push(market.base);
      market.coin = ar[0];
      market.pair = market.base+'_'+market.coin;
      market.id = str;
      market.exchange = 'exmo';

      // market.Volume = +item.vol || 0;
      market.BaseVolume = +item.vol * +item.avg;;
      market.Last = +item.last_trade
      market.High = +item.high;
      market.Low = +item.low;
      market.Ask = +item.buy_price;
      market.Bid = +item.sell_price;
      market.PrevDay = +item.avg;

      let mcBase =  marketCap[market.base];
      let basePrice = mcBase?mcBase.price_usd:0;
      let mc =  marketCap[market.coin];

      Mappers.mapDisplayValues2(market, basePrice,  mc);

      marketsAr.push(market);

    }




   // Mappers.mapDisplayValues2(market, base,  mc);
  }


  static bitfinexMarketDetails(result:BitfinexMarket, market:VOMarket, base:number, mc:VOMarketCap){
  //  market.Volume = +result.volume;
    market.BaseVolume = +result.volume * +result.last_price;
    market.Last = +result.last_price;
    market.Low = +result.low;
    market.High = +result.high;
    market.Ask = +result.ask;
    market.Bid = +result.bid;
    market.PrevDay =-1;


    Mappers.mapDisplayValues2(market, base,  mc);
  }

  static bitfinexCurencies(result:any, marketsAr:VOMarket[], indexed:{[pair:string]:VOMarket},   bases:string[],  marketCap:{[symbol:string]:VOMarketCap}){
   result.forEach(function (item) {
     let market:VOMarket = new VOMarket();

     let ar = [item.substr(-3), item.substr(0,item.length-3)];
     market.base = ar[0].toUpperCase();
     market.coin = ar[1].toUpperCase();
     market.pair =  market.base+'_'+market.coin;
     market.id = item;
     market.exchange = 'bitfinex';

     if(bases.indexOf(market.base) ===-1) bases.push(market.base);
     indexed[market.pair] = market;
     marketsAr.push(market);
    // console.log(ar);

   });
    return marketsAr.length;
  }

  static novaexchangeMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    base:string[],
    marketCap:{[symbol:string]:VOMarketCap}
  ):void{
   // console.log(reports);


    let ar:SOMarketNovaExchange[] = result.markets;


    ar.forEach(function (item:SOMarketNovaExchange) {

      if(!item.disabled){
        let market:VOMarket = new VOMarket();
        market.base = item.basecurrency;
        if(base.indexOf(market.base) === -1) base.push(market.base);
        market.coin = item.currency;

        //market.marketCap = marketCap[market.coin];
        market.pair = item.marketname;
        market.id = item.marketname;
        market.exchange = 'novaexchange';

       // market.Volume = +item.volume24h;
        market.Last = +item.last_price;
        market.High = +item.high24h;
        market.Low = +item.low24h;
        market.Ask = +item.ask;
        market.Bid = +item.bid;
        market.disabled = item.disabled;
        market.BaseVolume = +item.volume24h * +item.last_price;
        market.change = +item.change24h;
        market.PrevDay = -1;



        let mcBase =  marketCap[market.base];


        //if(!mcBase) console.warn(' no base price '+market.base +'  market name'+item.marketname)
        let basePrice = mcBase?mcBase.price_usd:0;

        let mc =  marketCap[market.coin];
        Mappers.mapDisplayValues(market, basePrice, 4, mc);



        indexed[market.pair] = market;
        marketsAr.push(market);
      }

      //let ar:string[] = item.MarketName.split('-');


    });

   // console.log(marketsAr);
  }




  static coinexchangeMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    base:string[],
    marketCap:{[symbol:string]:VOMarketCap},
    result1:any
  ):void{

   // let r1:{[id:string]:SOCurrencyCoinexchange} = _.keyBy(result1.resul,'MarketId');

/*

    let r:SOMarketCoinExchange[] = reports.reports;

    r.forEach(function (item) {

      let cur = this.ids[item.MarketID];
      let market: VOMarket = new VOMarket();
      market.Last = +item.LastPrice;

    },{ids:r1});
*/


    let r1: any[] = result.result;

    let ind: {[id:string]:SOCurrencyCoinexchange} = _.keyBy(result1.result, 'MarketID');

    r1.forEach(function (item) {

      let coin: any = ind[item.MarketID];


      let market = new VOMarket();
      market.id = item.MarketID;
      market.coin = coin.MarketAssetCode;
      market.base = coin.BaseCurrencyCode;
      market.pair =  market.base + '_'+ market.coin;
      market.exchange = 'coinexchange';
      market.Ask = +item.AskPrice;
      market.Bid = +item.BidPrice;
      market.Last = +item.LastPrice;
      market.Low = +item.LowPrice;
      market.High = +item.HighPrice;
      market.change =  +item.Change;
      // market.Volume = +item.Volume;
      market.BaseVolume =  +item.Volume * +item.LastPrice;
      market.OpenBuyOrders = +item.BuyOrderCount;
      market.OpenSellOrders =  +item.SellOrderCount;

      let mcBase = marketCap[market.base];
      let basePrice = mcBase ? mcBase.price_usd : 1;

      Mappers.mapDisplayValues(market, basePrice, 4, marketCap[market.coin]);

      let mc = marketCap[market.coin];
      if (!mc) {
        //console.log('no mc for ' + market.coin);
        market.usMC = 0;

      } else market.usMC = +mc.price_usd.toFixed(2);


      marketsAr.push(market);


    })



  }

  static poloniexMarkets(
    result:{[index:string]:SOMarketPoloniex},
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    base:string[],
    marketCap:{[symbol:string]:VOMarketCap}
  ):number{



      let i = 0;
    for (let str in result) {

      i++;
      let market: VOMarket = new VOMarket();

      let data = result[str];

      let ar: string[] = str.split('_');
      market.base = ar[0];
      if (base.indexOf(market.base) === -1) base.push(market.base);

      market.coin = ar[1];

      market.pair = str;
      market.id = str;
      market.exchange = 'poloniex';

     // market.Volume = +data.quoteVolume;
      market.Last = +data.last;
      market.High = +data.highestBid;
      market.Low = +data.lowestAsk;
      market.Ask = +data.lowestAsk;
      market.Bid = +data.highestBid;
      market.BaseVolume = +data.baseVolume;
      market.disabled = data.isFrozen !=='0';

      market.PrevDay = (+data.high24hr + +data.low24hr) / 2;

      let mcBase = marketCap[market.base];
      let basePrice = mcBase ? mcBase.price_usd : 1;

      Mappers.mapDisplayValues(market, basePrice, 4, marketCap[market.coin]);

      let mc = marketCap[market.coin];
      if (!mc) {
        //console.log('no mc for ' + market.coin);
        market.usMC = 0;

      } else market.usMC = +mc.price_usd.toFixed(2);

      marketsAr.push(market);
    }
    return i;
  }

  static hitbtcMarkets(
    result:SOMarketHitbtc[],
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    base:string[],
    marketCap:{[symbol:string]:VOMarketCap}
  ):number{

      let i = 0;
    for (let str in result) {

      i++;
      let market: VOMarket = new VOMarket();

      market.exchange = 'hitbtc';
      let item:SOMarketHitbtc = result[str];
      let l = str.length;
      market.base = str.substr(l-3);
      market.coin = str.substr(0,l-3);
      market.pair =  market.base + '_' + market.coin;
      market.id = str;

      if (base.indexOf(market.base) === -1) base.push(market.base);




    //  market.Volume = +item.volume_quote;
      market.BaseVolume = +item.volume *  +item.last;
      market.Ask = +item.ask;
      market.Bid = +item.bid;

      market.Last = +item.last;

      market.High = +item.high;
      market.Low = +item.low;

      market.PrevDay = +item.open;
      let basePrice = 1;
      if(market.base !=='USD'){
        let mcBase = marketCap[market.base];
        basePrice = mcBase ? mcBase.price_usd : 0;
      }

      Mappers.mapDisplayValues(market, basePrice, 4, marketCap[market.coin]);

      marketsAr.push(market);
    }
    return i;
  }


  static bittrexMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    base:string[],
    marketCap:{[symbol:string]:VOMarketCap},
    selected:string[],
    localCoins:{[symbol:string]:VOMarketCap}
    ):number{

    let ar:SOMarketBittrex[] = result.result;
    let BASES ={};

    ar.forEach(function (item) {
      let a = item.MarketName.split('-');
      if(a[0] ==='USDT')this.BASES[a[1]] = item.Last;

    }, {BASES:BASES});



    ar.forEach(function (item:SOMarketBittrex) {

      let ar:string[] = item.MarketName.split('-');

      let market:VOMarket = new VOMarket();

      market.base = ar[0];
      if(base.indexOf(market.base) === -1) base.push(market.base);
      market.coin = ar[1];
     // if(market.coin ==='BCC') market.coin= 'BCH';
      //market.marketCap = marketCap[market.coin];
      market.pair = ar.join('_');
      market.selected = selected.indexOf( market.pair) !==-1;

      market.id = item.MarketName;
      market.exchange = 'bittrex';

     // market.Volume = +item.Volume;
      market.Last = +item.Last;
      market.High = +item.High;
      market.Low = +item.Low;
      market.Ask = +item.Ask;
      market.Bid = +item.Bid;
      market.BaseVolume = +item.BaseVolume;
      market.PrevDay = item.PrevDay;
      market.OpenBuyOrders = item.OpenBuyOrders;
      market.OpenSellOrders = item.OpenSellOrders;

      let mcBase =  marketCap[market.base];
      let localBase = BASES[market.base];
      let mcCoin =  marketCap[market.coin];

      if(mcCoin && mcBase){
        localCoins[market.coin] = mcCoin;

        let mcRatio = mcCoin.price_usd / mcBase.price_usd;


        if(market.coin ==='QTUM'){
         console.log(mcRatio,  market.Last,  mcCoin.price_usd, mcBase.price_usd);

        }
        //let last = (market.Last*mcBase.price_usd);
        let diff = market.Last - mcRatio;
        let percent = 100 * diff/market.Last;
        market.mcDiff = percent.toPrecision(2);
      }


      let basePrice = mcBase?mcBase.price_usd:0;
      market.mcCoin = marketCap[market.coin];

      Mappers.mapDisplayValues(market, basePrice, 4, marketCap[market.coin]);
      indexed[market.pair] = market;
      marketsAr.push(market);

    })

    return result.length;
  }

  static cryptopiaMarkets(
    result:any,
    marketsAr:VOMarket[],
    indexed:{[pair:string]:VOMarket},
    base:string[],
    marketCap:{[symbol:string]:VOMarketCap}
  ):number{
    let ar: SOMarketCryptopia[] = result.Data;
    ar.forEach(function (item:SOMarketCryptopia) {
      let ar:string[] = item.Label.split('/');

      let market:VOMarket = new VOMarket();
      market.base = ar[1];
      if(base.indexOf(market.base) === -1) base.push(market.base);
      market.coin = ar[0];

      market.pair =  ar[1] + '_' +  ar[0];
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
      market.OpenSellOrders = item.SellVolume

      let mcBase =  marketCap[market.base];
      let basePrice = mcBase?mcBase.price_usd:1;
      Mappers.mapDisplayValues(market, basePrice, 4,  marketCap[market.coin]);

      indexed[market.pair] = market;
      marketsAr.push(market);

    })

    return result.length;
  }

  static livecoinMarkets( result: any, marketsAr: VOMarket[], indexed: { [p: string]: VOMarket }, baseCoins: string[], marketCap: { [p: string]: VOMarketCap }) {
//console.log(reports)
    let ar:SOMarketLiveCoin[] = result;

    ar.forEach(function (item:SOMarketLiveCoin) {

      let market:VOMarket = new VOMarket();

      let ar:string[] = item.symbol.split('/');
      market.coin = ar[0];
      market.base = ar[1];
      market.pair = market.base+'_'+market.coin;
      market.exchange = 'livecoin';
      market.id = item.symbol;

      market.Last = item.last;
      market.High = +item.high;
      market.Low = item.low;
      market.Ask = item.best_ask;
      market.Bid = item.best_bid;
      //market.Volume = item.volume;
      market.BaseVolume = item.volume *item.last ;
      market.PrevDay = -1;
      let mcB:VOMarketCap = marketCap[market.base];

      let base:number =  mcB?mcB.price_usd:-1;

     Mappers.mapDisplayValues2(market, base, marketCap[market.coin]);
      if(baseCoins.indexOf(market.base) === -1) baseCoins.push(market.base);
      indexed[market.pair] = market;
      marketsAr.push(market);
    });
    return marketsAr.length;
  }
  static mapDisplayValues1(item:VOMarket, basePrice:number, base_1h:number, base_24h:number, base_7d:number, marketCap:VOMCAgregated){
    let base = basePrice;
  //  item.dVolume = (item.Volume/1e6).toFixed(3)+'M';
    item.dBaseVolume = item.BaseVolume.toFixed(2);
    item.usAsk = (item.Ask * base).toPrecision(2);
    item.usBid =(item.Bid * base).toPrecision(2);
    item.usLow = parseFloat((item.Low * base).toPrecision(2));
    item.usHigh = parseFloat((item.High * base).toPrecision(2));
    item.usLast = parseFloat((item.Last * base).toPrecision(2));
    item.usPrevDay = (item.PrevDay * base).toFixed(2);
    if(marketCap){
      item.coinId = marketCap.id;
      item.coinRank = marketCap.rank;
      item.percent_change_7d = +(marketCap.percent_change_7d - base_7d).toFixed(2);
      item.percent_change_1h = +(marketCap.percent_change_1h - base_1h).toFixed(2);
      item.percent_change_24h = +(marketCap.percent_change_24h - base_24h).toFixed(2);
      item.usMC = +marketCap.price_usd.toPrecision(5);
      item.toMC = Math.round(1000 * (item.usLast - item.usMC)/ item.usMC)/10;
    }

  }

  static mapDisplayValues(item:VOMarket, basePrice:number, prec:number, marketCap:VOMarketCap){
    let base = basePrice;
   // item.dVolume = (item.Volume/1e6).toFixed(3)+'M';
    item.dBaseVolume = item.BaseVolume.toFixed(2);
    item.usAsk = (item.Ask * base).toFixed(2);
    item.usBid =(item.Bid * base).toFixed(2);
    item.usLow = parseFloat((item.Low * base).toPrecision(4));
    item.usHigh = parseFloat((item.High * base).toPrecision(4));
    item.usLast = parseFloat((item.Last * base).toPrecision(4));
    item.usPrevDay = (item.PrevDay * base).toFixed(2);
    if(marketCap){
      item.coinId = marketCap.id;
      item.coinRank = marketCap.rank;
      item.percent_change_7d = marketCap.percent_change_7d
      item.percent_change_1h = marketCap.percent_change_1h;
      item.percent_change_24h = marketCap.percent_change_24h;
      item.usMC = +marketCap.price_usd.toPrecision(4);
    }

  }
  static mapDisplayValues2(item:VOMarket, base:number,  marketCap:VOMarketCap, prec:number=4){


 //   item.dVolume = (item.Volume/1e6).toFixed(3)+'M';
    item.dBaseVolume = item.BaseVolume.toFixed(2);
    item.usAsk = (item.Ask * base).toPrecision(prec);
    item.usBid =(item.Bid * base).toPrecision(prec);
    item.usLow = parseFloat((item.Low * base).toPrecision(prec));
    item.usHigh = parseFloat((item.High * base).toPrecision(prec));
    item.usLast = parseFloat((item.Last * base).toPrecision(prec));
    item.usPrevDay = (item.PrevDay * base).toPrecision(prec);
    if(marketCap){
      item.coinId = marketCap.id;
      item.percent_change_7d = marketCap.percent_change_7d
      item.percent_change_1h = marketCap.percent_change_1h;
      item.percent_change_24h = marketCap.percent_change_24h;
      item.usMC = +marketCap.price_usd.toPrecision(4);
    }

  }


  static yobitCurencies(res: any, marketsAr: VOMarket[], indexed: { [p: string]: VOMarket }, baseCoins: string[], marketCap: { [p: string]: VOMarketCap }) {
    let obj = res.pairs;

    for(let str in obj){
      let ar = str.split('_');
      let market = new VOMarket();
      market.id = str;
      market.base = ar[1].toUpperCase();
      market.coin = ar[0].toUpperCase();
      market.pair =  market.base+'_'+market.coin;
      market.exchange = 'yobit';
      if(baseCoins.indexOf(market.base) === -1) baseCoins.push(market.base);
      marketsAr.push(market);
      indexed[market.pair] = market;
    }

    return marketsAr.length;
  }

  static yobitMarketDetails(res:{[id:string]:SOMarketYobit}, market:VOMarket, base:number, mc:VOMarketCap){



    for(let str in res){
      let result = res[str];
     // market.Volume = result.vol;
      market.BaseVolume = result.vol * result.last;// result.vol_cur;
      market.Last = result.last;
      market.Low = result.low;
      market.High = result.high;
      market.Ask = result.sell
      market.Bid = +result.buy
      market.PrevDay = result.avg;
    }



    Mappers.mapDisplayValues2(market, base,  mc);
  }
}






