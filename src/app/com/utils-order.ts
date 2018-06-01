import {VOMarketCap, VOOrder} from "../models/app-models";
import * as _ from 'lodash';


export const BUBBLE = {
  x:0,
  y:0,
  r:0
};

export interface VOBubble{
  x:number
  y:number
  r:number
}

export const ANALYTICS:VOAnalytics = {
  exchange:'',
  base:'',
  coin:'',
  dust:0,
  bubbles:[],
  min:0,
  max:0,
  sumBuyUS:0,
  sumSellUS:0,
  countBuy:0,
  countSell:0,
  dustCountBuy:0,
  dustCountSell:0,
  speed:0,
  duration:0,
  tolerance:0,
 rateLast:0
};

export interface VOAnalytics{
  dust:number;
  bubbles:VOBubble[];
  min:number;
  max:number;
  sumBuyUS:number;
  sumSellUS:number;
  countBuy:number;
  countSell:number;
  dustCountBuy:number;
  dustCountSell:number;
  speed:number;
  duration:number;
  tolerance:number;
  exchange:string;
  base:string;
  coin:string;
  rateLast:number;
};



export interface VOTradesStats{
  exchange:string;
  base:string;
  coin:string;
  time:string;
  timestamp:number;
  amountBuy:number;
  amountSell:number;
  amountBuyUS:number;
  amountSellUS:number;
  speed:number;
  speedPerMin:number;
  duratinMin:number;
  avgRate?:number;
  avgRateUS?:number;

  volUS:number;

  minUS?:number;
  maxUS?:number;
  priceBaseUS:number;
  rateLast:number;
  rateLastUS:number;
  priceToMC?:number;

  perHourBuy?:number;
  perHourSell?:number;
  totalUS?:number
  percentBuy?:number
}

export interface VOMarketsStats{
  Low:number
  High:number;
  Bid:number;
  Ask:number;
  Last:number;
  LowUS?:number
  HighUS?:number;
  BidUS?:number;
  AskUS?:number;
  LastUS?:number;
}


export interface IMarketDataCollect{
  coin:string;
  base:string
  exchange:string;
  priceBaseUS:number;
  tradesStats:VOTradesStats;
  marketStats:VOMarketsStats;
}


export interface IMarketRecommended {
  exchange:string;
  action:string;
  reports?:string[];

  status: string;
  updatedAt?:number;

  reason:string;
  base:string,
  coin:string;


  timeStats?:string
  date?:string;
  timestamp?:number;

  percent_1h_ToBase?:number;
  percentBuy?:number;
  persent_1h?:number[];
  SumPersent1h?:number;

  LastsUS?:number[];
  MCUS?:number[];
  lastToMC?:number;

  lastToMCTrades?:number;

  speedPerMinute?:number;

  AskToBid?:number

  price_B?:number;
  last_US?:number;
  askUS?:number;

  coinMC?: VOMarketCap;
  baseMC?: VOMarketCap;

  history?:IMarketDataCollect[]
  errors?:string[];
}

export class UtilsOrder{

  static  calculateLength(ar:VOOrder[]):number{
    if(!ar.length) return 0;
    let l = ar[ar.length-1].timestamp;
    let f = ar[0].timestamp
    let diff = l-f;
    return Math.round(diff/1000/60);
  }


  static takeAvarage(oredrs:VOOrder[], prev:number):number{
    if(oredrs.length === 0) return prev;
    let res = {S: 0, Q: 0};

    oredrs.forEach(function (item) {
      this.r.S += item.amountBase * item.rate;
      this.r.Q += item.amountBase;
    }, {r:res});

    return res.S/res.Q;
  }

  static makeLine(value:number, length:number):number[]{
    let out =[]
    while (length--) out.push(value);
    return out;
  }


  static caluculateTradesStats(trades:VOOrder[], timestamp:number, step:number, priceBaseUS:number):VOTradesStats{
    if(trades.length === 0){
      let date = new Date(timestamp);
      return {
        exchange:'',
        base:'',
        coin:'',
        speedPerMin:0,
        duratinMin:0,
        rateLastUS:0,
        rateLast:0,
        priceBaseUS:priceBaseUS,
        time:date.getHours()+':'+date.getMinutes(),
        timestamp:timestamp,
        amountBuy:0,
        amountBuyUS:0,
        amountSell:0,
        amountSellUS:0,
        speed:0,
        avgRate:0,
        avgRateUS:0,
        volUS:0,
        minUS:0,
        maxUS:0
      }
    }

    let stats = {
      priceB:priceBaseUS,
      amountBuy: 0,
      amountBuyUS:0,
      amountSell:0,
      amountSellUS:0,
      amountCoin:0,
      totalSpent:0,
      US:0,
      vol:0,
      from:timestamp - step,
      to:timestamp,
      max:0,
      min:1e10
    };

    trades.forEach(function (o) {

      if(o.timestamp < this.from || o.timestamp > this.to ) console.warn(' not in a range ' + new Date(this.from) + '  '+ new Date(this.to) + '  ' +new Date(o.timestamp))

      let priceUS = o.rate * this.priceB;
      let vol = o.rate * o.amountCoin;
      let volUS = Math.round(o.amountCoin * priceUS);

      if(this.max < priceUS) this.max = priceUS;
      if(this.min > priceUS) this.min = priceUS;

      this.US+=volUS;
      this.vol +=vol;
      this.amountCoin +=o.amountCoin;
      if(o.action === 'BUY') {
        this.amountBuy+=o.amountCoin;
        this.amountBuyUS += volUS;
      }
      else {
        this.amountSellUS +=volUS;
        this.amountSell += o.amountCoin;
      }

    }, stats);

    let date = new Date(timestamp);

    return{
      exchange:'',
      base:'',
      coin:'',
      speedPerMin:0,
      duratinMin:0,
      rateLastUS:0,
      rateLast:0,
      priceBaseUS:priceBaseUS,
      timestamp:timestamp,
      time:date.getHours()+':'+date.getMinutes(),
      amountBuyUS:stats.amountBuyUS,
      amountBuy:stats.amountBuy,
      amountSell:stats.amountSell,
      amountSellUS:stats.amountSellUS,
      speed:trades.length,
      volUS:stats.US,
      avgRateUS:stats.US/stats.amountCoin,
      avgRate:stats.vol/stats.amountCoin,
      minUS:stats.min,
      maxUS:stats.max
    }
  }


  static tradeStatsOneMinutes(trades:VOOrder[], fromTime:number, step:number, priceBaseUS:number):VOTradesStats[]{

    let timestamps = [];
    let out:VOTradesStats[] = [];
    let group:VOOrder[] = [];

    let endTime = fromTime + step;

    for (let i=0, n=trades.length;i<n; i++){
      let trade = trades[i];
      if(trade.timestamp < fromTime) continue;
      if(trade.timestamp >= endTime){
        out.push(UtilsOrder.caluculateTradesStats(group, endTime, step, priceBaseUS));
        endTime +=step;
        group = trade.timestamp < endTime ? [trade]:[];
      }else{
        group.push(trade);
      }

    }

    return out
  }

  static analizeOrdersHistory2(history:VOOrder[], priceBaseUS, dust=100){

    let l = history.length;
    let end = history[l-1].timestamp;


    let first = history[0];

   let start = history[0].timestamp;

    let duration = Math.round((end - start)/1000);
    let speed = l/duration;


    let out = {
      last10:l-(l/10),
      sumBaseLast10:0,
      sumCoinLast10:0,
      rateLast10:0,
      priceLast10US:0,
      dust:dust,
      bubbles:[],
      dustCountSell:0,
      dustCountBuy:0,
      countSell:0,
      countBuy:0,
      min:1e10,
      max:0,
      sumBuyUS:0,
      sumSellUS:0,
      duration:duration,
      speed: l/duration,
      tolerance: 0,
      base:first.base,
      coin:first.coin,
      exchange:first.exchange
    };

    history.forEach(function (item, i) {



      if(i > this.out.last10){

        this.out.sumBaseLast10 += item.amountCoin  * item.rate;
        this.out.sumCoinLast10 += item.amountCoin;
      }
      let priceUS = this.b * item.rate;
      let amountUS =  item.amountCoin  * item.rate * this.b;

      item.priceBaseUS = +priceUS.toPrecision(4);
      item.amountBaseUS = Math.round(amountUS);

      if(priceUS < this.out.min )this.out.min = priceUS;
      if(priceUS > this.out.max )this.out.max = priceUS;

      this.out.bubbles.push({
        x:item.timestamp,
        y:priceUS,
        r:item.action === 'BUY'?amountUS:-amountUS
      });

      if(amountUS < this.out.dust)item.action === 'BUY'?this.out.dustCountBuy++:this.out.dustCountSell++;

      if(item.action === 'BUY'){
        this.out.sumBuyUS += amountUS;
        this.out.countBuy++;

      }
      if(item.action === 'SELL'){
        this.out.sumSellUS += amountUS;
        this.out.countSell++;

      }
    },{b:priceBaseUS, out:out});


    out.tolerance = (100*(out.max - out.min)/out.max);
    out.rateLast10 = out.sumBaseLast10/out.sumCoinLast10;
    out.priceLast10US =  +(out.rateLast10 * priceBaseUS).toPrecision(5);

    return out;

  }


 static analizeOrdersHistory(history:VOOrder[], priceBaseUS){

    let buy = [];
    let sell = [];
    let bubbles:VOBubble[] = [];
    let dustCountSell = 0;
    let dustCountBuy = 0;
    let l = history.length;
    let last = history[0].timestamp;
    let first = history[l-1].timestamp;

   let duration = Math.round((last-first)/1000);
   let speed = l/duration;

    let min = 1e10;
    let max = 0;
    let sumBuy = 0;
    let sumSell = 0;

    let fishes = [];

    history.forEach(function (item) {

      let priceUS = this.b * item.rate;
      let amountUS =  item.amountCoin  * item.rate * this.b;



      item.priceBaseUS = +priceUS.toPrecision(4);
      item.amountBaseUS = Math.round(amountUS);



      if(priceUS < min )min = priceUS;
      if(priceUS > max )max = priceUS;

      let bbl:VOBubble = {
        x:item.timestamp,
        y:priceUS,
        r:item.action === 'BUY'?amountUS:-amountUS
      };

      bubbles.push(bbl);

      if(amountUS > 50000) fishes.push(bbl);

      if(amountUS < 100)item.action === 'BUY'?dustCountBuy++:dustCountSell++;

      if(item.action === 'BUY'){
        sumBuy += amountUS;
        this.buy.push(item);
      }
      if(item.action === 'SELL'){
        sumSell += amountUS;
        this.sell.push(item);
      }
    },{b:priceBaseUS, buy:buy, sell:sell});

   let tolerance = (100*(max - min)/max);
    //console.log(bubbles);
    return{
      buy:buy,
      sell:sell,
      bubbles:bubbles.reverse(),
      dustCountBuy:dustCountBuy,
      dustCountSell:dustCountSell,
      min:min,
      max:max,
      sumBuy:sumBuy,
      sumSell:sumSell,
      fishes:fishes,
      tolerance:tolerance,
      speed:speed,
      duration:duration
    }

  }




  static createOneChart(history:VOOrder[]):{history:number[], timestamps:number[]}{

    let start = history[0].timestamp;
    let end = history[history.length -1].timestamp;



    // let step = (end - start) /10;

    //let nextTime  = start + step;

    let step = Math.round((start - end) /10);

    let nextTime  = start - step;
    //let nextTimeB  = start + step;

    let timestamps = [];
    let out = [];
    let group:VOOrder[] = [];
    let avg:number =0;

//
    //console.warn(Math.round(step/1000))
    //console.warn(nextTime);

    let startTime = new Date(start);
    let nextTimed = new Date(nextTime);
    //console.log(startTime.getMinutes()  + ':'+ startTime.getSeconds())
    // console.log(nextTimed.getMinutes()  + ':'+ nextTimed.getSeconds())


    history.forEach(function (item, i) {
      if(item.timestamp > nextTime) {
        group.push(item);
      }else{
        // console.log(i + ' go next ' + item.timestamp + '  nextTime '+ nextTime);

        //console.log(nextTimed.getMinutes()  + ':'+ nextTimed.getSeconds())

        //console.log(new Date(item.timestamp).toTimeString());

        let time = new Date((item.timestamp + (step)));

        timestamps.push(time.getMinutes());

        avg = UtilsOrder.takeAvarage(group, avg);

        avg = +avg.toPrecision(5);

        out.push(avg);
        //  console.log(i + ' nextTime ' + nextTime +' min ' +item.minutes + '  avgB  '+  avgB +' avgS ' + avgS, groupB, groupS);

        group= [];


        nextTime -=step
      }

      /* timestamps.push(item.timestamp);
       if(item.status === 'buy') buys.push(item);
       else if(item.status === 'sell') sells.push(item);
       else console.warn(item);*/
    });


    let time = new Date((end ));
    timestamps.push(time.getMinutes());
    avg = UtilsOrder.takeAvarage(group, avg);
    out.push(avg);
    return{
     history:out,
      timestamps:timestamps
    }
  }

  static createCharts(history:VOOrder[]):{bought:number[], sold:number[], timestamps:number[]}{

    let start = history[0].timestamp;
    let end = history[history.length -1].timestamp;



   // let step = (end - start) /10;

    //let nextTime  = start + step;

    let step = Math.round((start - end) /10);

    let nextTime  = start - step;
    //let nextTimeB  = start + step;

    let timestamps = [];
    let buys = [];
    let sells = [];
    //let i = 1;
    let groupS:VOOrder[] = [];
    let groupB:VOOrder[] = [];

    let avgB:number =0;
    let avgS:number =0;
//
    //console.warn(Math.round(step/1000))
    //console.warn(nextTime);

    let startTime = new Date(start);
    let nextTimed = new Date(nextTime);
    //console.log(startTime.getMinutes()  + ':'+ startTime.getSeconds())
   // console.log(nextTimed.getMinutes()  + ':'+ nextTimed.getSeconds())


    history.forEach(function (item, i) {
      if(item.timestamp > nextTime) {
        if(item.action === 'BUY') groupB.push(item);
        else if(item.action === 'SELL') groupS.push(item);
        else console.warn(item);
      }else{
        // console.log(i + ' go next ' + item.timestamp + '  nextTime '+ nextTime);

        //console.log(nextTimed.getMinutes()  + ':'+ nextTimed.getSeconds())

        //console.log(new Date(item.timestamp).toTimeString());

        let time = new Date((item.timestamp + (step)));

        timestamps.push(time.getMinutes());

        avgB = UtilsOrder.takeAvarage(groupB, avgB);

        if(!avgB) avgB = avgS;
        avgB = +avgB.toPrecision(5);

        buys.push(avgB);
        if(!avgS) avgS = avgB;
        avgS = UtilsOrder.takeAvarage(groupS, avgS);

        avgS = +avgS.toPrecision(5);
        sells.push(avgS);


       //  console.log(i + ' nextTime ' + nextTime +' min ' +item.minutes + '  avgB  '+  avgB +' avgS ' + avgS, groupB, groupS);

        groupB = [];
        groupS = [];

        nextTime -=step
      }

      /* timestamps.push(item.timestamp);
       if(item.status === 'buy') buys.push(item);
       else if(item.status === 'sell') sells.push(item);
       else console.warn(item);*/
    });


    let time = new Date((end ));
    timestamps.push(time.getMinutes());

    avgB = UtilsOrder.takeAvarage(groupB, avgB);

    avgB = +avgB.toPrecision(5);

    buys.push(avgB);
    avgS = UtilsOrder.takeAvarage(groupS, avgS);

    avgS = +avgS.toPrecision(5);
    sells.push(avgS);



    return{
      bought:buys,
      sold:sells,
      timestamps:timestamps
    }
  }


}

