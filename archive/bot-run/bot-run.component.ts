import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from "@angular/material";
import {ConnectorApiService} from "../../src/app/my-exchange/services/connector-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiBase, IApiPublic} from "../../src/app/my-exchange/services/apis/api-base";
import {ANALYTICS, UtilsOrder, VOAnalytics, VOBubble, VOTradesStats} from "../../src/app/com/utils-order";



import * as _ from 'lodash';

@Component({
  selector: 'app-bot-run',
  templateUrl: './bot-run.component.html',
  styleUrls: ['./bot-run.component.css']
})
export class BotRunComponent implements OnInit {

  exchange:string;
  market:string;
  currentAPI:ApiBase;


  balanceBase;
  balanceCoin;
  balanceBaseUS;
  balanceCoinUS;
  marketInit = {base:'', coin:'', exchange:'', market:'', priceBaseUS:0, rate:0};
  amountBase;
  amountUS = 50;

  analytics:VOAnalytics = ANALYTICS;

  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) { }

  isLogedIn:boolean;

  onLoginClick(){

  }



  onRefreshBalancesClick(){

  }

  ngOnInit() {
    this.route.params.subscribe(params=>{
      this.exchange = params.exchange;
      this.market = params.market;
      console.log(params);
      this.currentAPI = this.apiService.getPrivateAPI(this.exchange);
      if(!this.currentAPI){
        console.error(' no API '+ this.exchange);
        return
      }
      this.currentAPI.isLogedIn$().subscribe(login=>{
        this.isLogedIn = login;
        if(login) this.onMarketChange();

      });
      this.currentAPI.autoLogin();
    })
  }


/*
  calculateLength(ar:VOBubble[]):number{
    if(!ar.length) return 0;
    let l = ar[ar.length-1].x;
    let f = ar[0].x
    let diff = l-f;
    return MATH.round(diff/1000/60);
  }

  downloadHistory(callBack:(err, res)=>void){
    if(!this.marketInit) return;
    let cur = this.marketInit;
    let sub1 =  this.currentAPI.downloadMarketHistory(cur.base, cur.coin).subscribe(coindatas=>{
      //console.log(coindatas);
      if(!coindatas) return;
      this.analytics = UtilsOrder.analizeOrdersHistory(coindatas, this.marketInit.priceBaseUS);
      sub1.unsubscribe()
      callBack(null, this.analytics.bubbles);
    },err=>{
      callBack(err, null);
    });

  }*/


  setBalances(){
    let base =  this.marketInit.base;
    let coin = this.marketInit.coin;

    let priceBaseUS = this.marketInit.priceBaseUS;
    let rate = this.marketInit.rate;
    //console.warn('setBalances');
    this.currentAPI.getBalance(base).then(balB=> {

      this.currentAPI.getBalance(coin).then(balC=> {

        this.balanceBase = balB.balance;
        this.balanceCoin = balC.balance;
        this.balanceBaseUS  = +(balB.balance * priceBaseUS).toFixed(2);
        this.balanceCoinUS =  +(balC.balance * rate * priceBaseUS).toFixed(2);
      });

    });

  }

  history:VOBubble[] =[];

  rate:number;

  processAction(action, amountCoin){

  }


  onBuyClick(){
    let action = 'BUY';

    let amountBase:number = +this.amountUS/this.marketInit.priceBaseUS;
    if(amountBase > this.balanceBase) amountBase = this.balanceBase - (this.balanceBase* 0.0025);
    let amountCoin =  amountBase/this.rate;
    this.processAction(action, amountCoin);
  }

  onSellClick(){
    let action = 'SELL';

    let amountCoin =  +this.amountUS/this.marketInit.priceBaseUS/this.rate;
    if(amountCoin > this.balanceCoin) amountCoin  = this.balanceCoin - (this.balanceCoin * 0.0025);

    this.processAction(action, amountCoin);
  }


  //allStats:{[id:string]:VOTradesStats[]} = {};

  runBot(){


   // let fromTime = (MATH.ceil(Date.now()/1000/60) - 180) *60 *1000;
   // let analytics =  UtilsOrder.tradeStatsOneMinutes(lastTrades, fromTime, this.marketInit.priceBaseUS,100, 20000);


   // console.log(analytics);
  }
/*

  saveStats(id){
    //console.log(' saving '+ id, this.allStats[id]);
    localStorage.setItem('stats' +id, JSON.stringify(this.allStats[id]));
  }

  removeOldStats(id:string, amountMin:number){
    let last = Date.now() - (amountMin * 60 * 1000);
    let stats:VOTradesStats[] = this.allStats[id];
    this.allStats[id] = stats.filter(function (item) {
      return item.timestamp > last;
    })
  }

  getStatsById(id){
    if(!this.allStats[id]){
      let str = localStorage.getItem('stats' +id) || '[]';
      this.allStats[id] = JSON.parse(str);
    }
    return this.allStats[id];
  }
*/




  /*addTrades(trades:VOOrder[]){
    let id = trades[0].exchange + '_'+ trades[0].base + '_'+trades[0].coin;
    let stats:VOTradesStats[]  = this.getStatsById(id);
    if(stats.length){
      let last = stats[stats.length-1].timestamp;
      //let newTrades =

      //console.log(' last stat '+ new Date(last).toLocaleTimeString());

      /!*console.log(trades.map(function (item) {
        return new Date(item.timestamp).toLocaleTimeString();
      }));
*!/


      //if(trades[0].timestamp < last)
      let newstats = UtilsOrder.tradeStatsOneMinutes(trades, last, this.marketInit.priceBaseUS,100, 20000);
      //console.log(id + ' stats ' ,stats[stats.length-1], newstats);
      //console.log( 'new  stats ' , newstats);

      this.allStats[id] = stats.concat(newstats);
    }else {
      let fromTime = (MATH.ceil(Date.now()/1000/60) - 180) *60 *1000;

      stats = UtilsOrder.tradeStatsOneMinutes(trades,fromTime, this.marketInit.priceBaseUS,100, 20000);
      this.allStats[id] = stats;
    }

    this.removeOldStats(id, 180);
    this.saveStats(id);
  }*/

  dusts=[];

 // tradesData:TradesData[] =[];
  onMarketChange(){
    let pair = this.market;
    if(!pair || pair.indexOf('_') ===-1) return;

    let ar =  pair.split('_');
    let base= ar[0];
    let coin = ar[1];
    // this.modelBuySell.market = pair;

    //this.market = this.base+'_' + this.coin;
    this.marketInit = {base:'', coin:'', exchange:'', market:'', priceBaseUS:0, rate:0};
    console.warn('onMarketChange');
  /*  this.currentAPI.getPriceForBase(ar[0]).then(priceBaseUS=>{

      //console.warn(res);
      if(!priceBaseUS) return;
      // console.warn(res);

      this.currentAPI.getRate(base, coin).then(rate=>{

        let priceCoin = +(priceBaseUS * rate).toPrecision(5);

        this.amountBase =  +(this.amountUS / priceBaseUS).toPrecision(8);

        this.marketInit = {
          priceBaseUS:priceBaseUS,
          rate:rate,
          coin:coin,
          base:base,
          market:pair,
          exchange:this.currentAPI.exchange
        };

        console.log('market Init ', this.marketInit);
        this.setBalances();

        let publicApi:any = this.currentAPI
       /!* publicApi.downloadMarketHistoryForPeriod(base, coin, 180, 5).subscribe(res=>{
          console.warn(res);
        })*!/


       /!* this.botService.subscribeForHistory(this.marketInit, this.currentAPI).subscribe(coindatas=>{

          console.log(this.marketInit.exchange + '  ' + UtilsOrder.calculateLength(coindatas)  + ' min');

          if(coindatas.length)this.analytics = UtilsOrder.analizeOrdersHistory2(coindatas, this.marketInit.priceBaseUS);

         // console.log(analytics)
         // this.analytics = analytics
         // this.runBot(analytics);

        })
*!/
      })


    }).catch(err=>{

      console.error('cant get price for base ' +ar[0], err)

    });*/

  }

}
