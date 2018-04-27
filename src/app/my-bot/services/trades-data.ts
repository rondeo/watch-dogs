import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {Observable} from "rxjs/Observable";

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import * as _ from 'lodash';
import {UtilsOrder, VOBubble, VOTradesStats} from "../../services/utils-order";
import {VOOrder} from "../../models/app-models";

export class TradesData{
  exchange:string;
  id:string;
  basePrice:number;
  private trades:VOOrder[];

  dustSub:Subject<VOBubble[]> = new Subject();

  dust$():Observable<VOBubble[]>{
    return this.dustSub.asObservable();
  }

  speedSub:Subject<number>;
  speed$(){
    return this.speedSub.asObservable();
  }

  bubbles:VOBubble[];


  bubblesSub:Subject<VOBubble[]> = new Subject();
  bubbles$(){
    return this.bubblesSub.asObservable();
  }

  allStats:VOTradesStats[];
  statsSub:Subject<VOTradesStats[]> = new Subject<VOTradesStats[]>()
  stats$():Observable<VOTradesStats[]>{
    return this.statsSub.asObservable();
  }

  trades$():Observable<VOOrder[]>{
    return this.tradesSub.asObservable()
  }
  private tradesSub:Subject<VOOrder[]>;

  constructor(private api:IApiPublic, private  base:string, private coin:string, private priceBaseUS:number, private tradesLength, private dust){

    this.id = api.exchange + '_'+base + '_'+ coin;
    this.exchange = api.exchange;
    this.speedSub = new Subject<number>();
    this.tradesSub = new Subject<VOOrder[]>();
  }



  createBubbles(stats:VOTradesStats[]):VOBubble[]{

    return stats.map(function (item) {
      return{
        x:item.timestamp,
        y:item.avgRateUS,
        r:item.amountBuyUS - item.amountSellUS
      }
    })
  }


  addTrades(trades:VOOrder[]){

    let priceBaseUS = this.priceBaseUS;

    let dust = [];
    let noDust = [];
    let fishes = [];

     trades.forEach(function (item) {
       let amountUS =  item.amountCoin * item.rate * priceBaseUS;
         if(amountUS < 300) dust.push(item);
         else noDust.push(item);
         if(amountUS > 50000) fishes.push(item);
    });

     trades = noDust;



    //console.log(this.id + ' trades ' +  trades.length + ' form ' + new Date(trades[0].timestamp) + ' to '+ new Date(trades[trades.length-1].timestamp));

    //let id = trades[0].exchange + '_'+ trades[0].base + '_'+trades[0].coin;
    let oldStats:VOTradesStats[]  = this.getStats();

    let step = (60 * 1000);
    let allStats:VOTradesStats[];

    if(oldStats.length){

     // console.log(this.id + ' old stats ' +  oldStats.length + ' form ' + new Date(oldStats[0].timestamp) + ' to '+ new Date(oldStats[oldStats.length-1].timestamp));

      let last = oldStats[oldStats.length-1].timestamp;

      let newstats = UtilsOrder.tradeStatsOneMinutes(trades, last, step, priceBaseUS);


      /*let moreThen2 = newstats.filter(function (item) {
        return Math.abs(item.minUS - item.avgRateUS)/item.avgRateUS > 0.02 || Math.abs(item.maxUS - item.avgRateUS)/item.avgRateUS > 0.02;
      })*/


      allStats = oldStats.concat(newstats);



    }else {

      let fromTime = trades[0].timestamp - 60 * 1000;;

      allStats  = UtilsOrder.tradeStatsOneMinutes(trades, fromTime, step, this.priceBaseUS);

    }




    this.allStats =  this.removeOldStats(allStats, 180);

    this.statsSub.next(this.allStats);

    let bubbles = this.createBubbles(this.allStats);
   /* let dust= [];
    let prev = 0;
    let out =[];

    bubbles.forEach(function (o) {
      if( Math.abs(o.r) > 300){
        prev = o.y;
          out.push(o);
      }else if(o.r){

        console.log(' dust '+o.r +' ' + (o.y).toPrecision(5) + ' prev ' +  prev.toPrecision(5)+ ' % '+(100 * (o.y - prev)/prev).toFixed(2));
        if(Math.abs(o.r) > 80 && prev && (100* Math.abs( o.y - prev)/prev) > 1.5){
          dust.push(o);
        }

      }

    });

    if(dust.length){

      this.dustSub.next(dust);
    }*/
    this.bubbles = bubbles;

  //  console.log(this.id + ' bubbles ' +  this.bubbles.length + ' form ' + new Date(this.bubbles[0].x) + ' to '+ new Date(this.bubbles[this.bubbles.length-1].x));
   // console.log(this.bubbles);
    this.saveStats();
  }


  saveStats(){
    //console.log(' saving '+ id, this.allStats[id]);
    localStorage.setItem('stats-' +this.id, JSON.stringify(this.allStats));
  }

  removeOldStats(stats:VOTradesStats[], amountMin:number):VOTradesStats[]{
    let last = Date.now() - (amountMin * 60 * 1000);
    return stats.filter(function (item) {
      return item.timestamp > last;
    })
  }

  getStats(){
    if(!this.allStats){
      let str = localStorage.getItem('stats-' +this.id) || '[]';
      this.allStats= JSON.parse(str);
    }
    return this.allStats;
  }


  start(){

    this.downloadTrades();

  }


  prevTrades:VOOrder[];

  onTrades(trades:VOOrder[]){

    let prevTrades = this.prevTrades || [];

    let last = prevTrades.length?prevTrades[prevTrades.length-1].timestamp:0;

    let newTrades = trades.filter(function (item) {
      return item.timestamp > last;
    });

    if(newTrades.length) this.prevTrades = newTrades;

    let allTrades = prevTrades.concat(newTrades);
    this.prevTrades = trades;
    //console.log(this.id + '  previous last ' + new Date(last).toTimeString() + ' new trades '+ trades.length);

    if(newTrades.length){

      this.tradesSub.next(newTrades);
      this.addTrades(allTrades);
    }



  }


  downloadTrades(){


    let delay = 20000;

    this.api.downloadTrades(this.base, this.coin).subscribe(trades=>{

      trades = _.orderBy(trades, 'timestamp');

      let diff = trades[trades.length-1].timestamp - trades[0].timestamp;

      let min = diff/1000/60;

      let speedPerMinute = (trades.length/min).toPrecision(5);

      this.speedSub.next(+speedPerMinute);

      delay = Math.round(diff/2);
      if(isNaN(delay)) delay = 20000;
      if(delay < 20000) {
        console.warn('trades go too fast ' + speedPerMinute);
        delay = 20000;
      }

      if(delay > 5*60*1000) delay = 5*60*1000;

      setTimeout(()=>this.downloadTrades(), delay);

      this.onTrades(trades);
      console.log(this.id +'  next trades download in '+ (delay/ 1000/60).toPrecision(4) + ' min');
/*
      let oldTrades =this.getHistory();
      ///console.log(' old history ', oldHistory);

      if(oldTrades.length){

        let last = oldTrades[oldTrades.length-1].timestamp;

        let newTrades = trades.filter(function (item) {
          return item.timestamp > this.t;
        },{t:last});

        //console.log(' adding  new  history '+ newHistory.length);

        trades = oldTrades.concat(newTrades);

        /// console.log(' after cocat  ' + history.length);
        trades = TradesData.removeOldOrders(trades, this.tradesLength);
      }

       let length = trades[trades.length-1].timestamp - trades[0].timestamp;


      console.log(this.id +' length '+Math.round(length/1000/60)+ ' min  next trades download in '+ (delay/ 1000/60).toPrecision(4) + ' min');
      //console.log(this.id + ' history length ' + UtilsOrder.calculateLength(history) + ' min');



      this.trades = trades;
      this.tradesSub.next(trades);
      this.saveHistory();*/
    }, error=>{

      setTimeout(()=>this.downloadTrades(), 20000);
      console.error(error);
    })
  }


 /* getHistory():VOOrder[]{
    if(!this.trades) this.trades = (JSON.parse(localStorage.getItem(this.id) || '[]')).map(function (o) {
      return {
        status:o[1] > 0?'BUY':'SELL',
        amountCoin:Math.abs(o[1]),
        timestamp:o[0] * 1000,
        rate:o[2],
        exchange:this.e,
        base:this.b,
        coin:this.c
      }
    },{e:this.exchange, b:this.base, c:this.coin});


    return this.trades;
  }

  saveHistory(){

    let out = this.trades.filter(function (item) {
      return item.amountCoin > this.d;
    },{d:this.dust}).map(function (o:VOOrder) {
      let amount = o.status ==='BUY'?o.amountCoin:-o.amountCoin;
      return [Math.round(o.timestamp/1000),+(amount).toPrecision(4),+(o.rate).toPrecision(5)];
    });

    // console.log(this.id + ' saving '+ out.length);
    localStorage.setItem(this.id, JSON.stringify(out));
  }*/

  static removeOldOrders(orders:VOOrder[], minutes:number):VOOrder[]{
    let last = orders[orders.length-1].timestamp;
    let h3 = minutes*60*1000;
    let first = last - h3;
    return orders.filter(function (item) {
      return item.timestamp > this.f;
    },{f:first});
  }




}