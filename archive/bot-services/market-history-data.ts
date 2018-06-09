import {ApiBase} from "../../src/app/my-exchange/services/apis/api-base";
import {ANALYTICS, UtilsOrder, VOAnalytics, VOBubble} from "../../src/app/com/utils-order";
import {EventEmitter} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {VOOrder} from "../../src/app/models/app-models";


export class MarketHistoryData{

  private historySub:BehaviorSubject<VOOrder[]>;

  history$():Observable<VOOrder[]>{
    return this.historySub.asObservable();
  }

  id:string;
  history:VOOrder[];

  analytics:VOAnalytics = ANALYTICS;

  historyLength = 180;
  isSaveHistory = true;

  constructor(
    private exchange:string,
    private base:string,
    private coin:string,
    private priceBaseUS:number,
    private currentAPI:ApiBase
  ){


    this.id = exchange + '_'+base + '_'+coin;
   // this.analytics.bubbles = this.getBubbles();

    this.historySub = new BehaviorSubject<VOOrder[]>(this.getHistory());
    //this.id = exchange+'_'+market;

    this.redownloadHistory();
  }


  private removeSmallBubbles(orders:VOBubble[], dust:number):VOBubble[]{

    return orders.filter(function (item) {
      return  Math.abs(item.r) > this.dust;
    },{dust:dust});
  }

  private removeOldOrders(orders:VOOrder[], minutes:number):VOOrder[]{
    let last = orders[orders.length-1].timestamp;
    let h3 = minutes*60*1000;
    let first = last - h3;
    return orders.filter(function (item) {
      return item.timestamp > this.f;
    },{f:first});
  }


/*
  private getBubbles(){
    if(!this.bubbles){

      this.bubbles = JSON.parse(localStorage.getItem(this.id) || '[]').map(function (o) {
        return {
          x:o[0]*1000,
          y:o[1],
          r:o[2]
        }
      });

      let length = this.calculateLength(this.bubbles);
      console.log(this.id + ' loaded data  for '+ length + ' min');
    }

    return this.bubbles;
  }*/

 /* private saveHistory(){
    let bubbles = this.removeSmallBubbles(this.bubbles, this.dust);
    if(!bubbles.length) return;
    let length = this.calculateLength(bubbles);
    let out = bubbles.map(function (o) {
      return [Math.round(o.x/1000),+(o.y).toPrecision(4),Math.round(o.r)];
    });
    console.log(this.id + ' saving data  for '+ length + ' min');
    localStorage.setItem(this.id, JSON.stringify(out));

  }
*/


 getHistory():VOOrder[]{
   if(!this.history) this.history = (JSON.parse(localStorage.getItem(this.id) || '[]')).map(function (o) {
     return {
       action:o[1] > 0?'BUY':'SELL',
       amountCoin:Math.abs(o[1]),
       timestamp:o[0] * 1000,
       rate:o[2],
       exchange:this.e,
       base:this.b,
       coin:this.c
     }
   },{e:this.exchange, b:this.base, c:this.coin});

   return this.history;
 }

 saveHistory(){
   let out = this.history.map(function (o:VOOrder) {
     let amount = o.action ==='BUY'?o.amountCoin:-o.amountCoin;
     return [Math.round(o.timestamp/1000),+(amount).toPrecision(4),+(o.rate).toPrecision(5)];
   });

  // console.log(this.id + ' saving '+ out.length);
   localStorage.setItem(this.id, JSON.stringify(out));
 }

  downloadHistoryTimeout;
  redownloadHistory(){

    this.downloadHistory((err, diff)=>{
      let delay = 20000;
      if(!err){
         // console.log(this.id + ' coindatas duration '+ (diff/1000/60) + ' min');
          delay = Math.round(diff/2);
          if(delay < 20000) {
            //console.log(this.id + ' delay ' + delay);
            delay = 20000;
          }
      }

      console.log(this.id + ' reload in '+ (delay/1000/60).toPrecision(4) + ' min');

      this.downloadHistoryTimeout = setTimeout(()=>{
        this.redownloadHistory();
      }, delay );

    });
  }


  private downloadHistory(callBack:(err, res)=>void){

    let sub1 =  this.currentAPI.downloadMarketHistory(this.base, this.coin).subscribe(history=>{
     // console.log(coindatas);
      if(!history) return;

      history.reverse();
      let diff = history[history.length-1].timestamp - history[0].timestamp;

      let oldHistory = this.getHistory();
      ///console.log(' old coindatas ', oldHistory);

      if(oldHistory.length){

        let last = oldHistory[oldHistory.length-1].timestamp;

        let newHistory = history.filter(function (item) {
          return item.timestamp > this.t;
        },{t:last});

        //console.log(' adding  new  coindatas '+ newHistory.length);

        history = oldHistory.concat(newHistory);

       /// console.log(' after cocat  ' + coindatas.length);
        history = this.removeOldOrders(history, this.historyLength);
      }

      //console.log(this.id + ' coindatas length ' + UtilsOrder.calculateLength(coindatas) + ' min');

      this.history = history;
      this.historySub.next(history);
      if(this.isSaveHistory) this.saveHistory();

      /*



      this.analytics = UtilsOrder.analizeOrdersHistory2(coindatas, this.priceBaseUS);

      //console.log(this.analytics);



      this.analytics.bubbles;

      let last = oldHistory.length?oldHistory[oldHistory.length-1].x:0;

      console.log(' was last '+ last +'  now last '+ newHistory[newHistory.length - 1].x);

      let newData = newHistory.filter(function (o) {
        return o.x > last;
      });


      if(newData.length){

        this.bubbles = this.removeOldBubbles(oldHistory.concat(newData), this.historyLength);
        this.analytics.bubbles = this.bubbles
        this.analytics.exchange = this.exchange;
        this.analytics.base = this.base;
        this.analytics.coin = this.coin;

        if(this.isAnalytics)this.analyticsSub.next(this.analytics);
        if(this.isSaveHistory)this.saveHistory();
      }
*/
      sub1.unsubscribe();

      callBack(null,diff);
    },err=>{
      callBack(err, null);
    });

  }

}