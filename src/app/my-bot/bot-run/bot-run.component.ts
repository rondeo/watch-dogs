import { Component, OnInit } from '@angular/core';
import {MatSnackBar} from "@angular/material";
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiBase} from "../../my-exchange/services/apis/api-base";
import {UtilsOrder, VOBubble} from "../../my-exchange/utils-order";
import {VOOrder} from "../../my-exchange/services/my-models";

@Component({
  selector: 'app-bot-run',
  templateUrl: './bot-run.component.html',
  styleUrls: ['./bot-run.component.css']
})
export class BotRunComponent implements OnInit {

  exchange:string;
  market:string;
  currentAPI:ApiBase;


  balanceBase
  balanceCoin
  balanceBaseUS;
  balanceCoinUS;
  marketInit = {base:'', coin:'', exchange:'', market:'', priceBaseUS:0, rate:0};
  amountBase;
  amountUS = 50;

  analytics = {
    buy:[],
    sell:[],
    bubbles:[],
    min:0,
    max:0,
    sumBuy:0,
    sumSell:0,
    dustCountBuy:0,
    dustCountSell:0,
    speed:0,
    duration:0,
    tolerance:0,
    fishes:[]
  };

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
      this.currentAPI = this.apiService.getHttpConnector(this.exchange);
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

    let arch = this.getArchive();

    this.history = arch.orders;

    let l = this.calculateLength(this.history)
    console.log(' history length '+ l + ' min')
  }



  calculateLength(ar:VOBubble[]):number{
    if(!ar.length) return 0;
    let l = ar[ar.length-1].x;
    let f = ar[0].x
    let diff = l-f;
    return Math.round(diff/1000/60);
  }

  downloadHistory(callBack:(err, res)=>void){
    if(!this.marketInit) return;
    let cur = this.marketInit;
    let sub1 =  this.currentAPI.downloadMarketHistory(cur.base, cur.coin).subscribe(history=>{
      //console.log(history);
      if(!history) return;
      this.analytics = UtilsOrder.analizeOrdersHistory(history, this.marketInit.priceBaseUS);
      sub1.unsubscribe()
      callBack(null, this.analytics.bubbles);
    },err=>{
      callBack(err, null);
    });

  }


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

  getArchive(){
    if(!this.oredrsArchive){
      let id = this.exchange + '_'+this.market;
      let str = localStorage.getItem(id)
      if(!str) this.oredrsArchive = {
        exchange:this.exchange,
        lastTimestamp:Date.now(),
        market:this.market,
        orders:[]
      }
      else {
        this.oredrsArchive = JSON.parse(str);
        this.oredrsArchive.orders = this.oredrsArchive.orders.map(function (o) {
          return {
            x:o[0]*1000,
            y:o[1],
            r:Math.abs(o[2]),
            a:o[2]>0?1:0
          }
        })

      }
    }

    return this.oredrsArchive;
  }

  removeOldAndSmallBubbles(orders:VOBubble[]):VOBubble[]{
    let last = orders[orders.length-1].x;
    let h3 = 3*60*60*1000;
    let first = last - h3;
   return orders.filter(function (item) {
      return item.x > this.first && item.r>100;
    },{first:first})
  }

  saveHistory(){

    // out:number[][]=[];
    let history = this.history;

    if(!history.length) return;
    let length = this.calculateLength(history);

    let out = history.map(function (o) {
      let amount = o.a?o.r:-o.r;

      return [Math.round(o.x/1000),+(o.y).toPrecision(4),Math.round(amount)];
    });

    let arch = {
      exchange:this.exchange,
      lastTimestamp:Date.now(),
      market:this.market,
      orders:out
    };

    console.log(' saving data  for '+ length + ' min', arch);
    let id = this.exchange + '_'+this.market;


    localStorage.setItem(id, JSON.stringify(arch));
  }

  oredrsArchive:{
    lastTimestamp:number,
    exchange:string,
    market:string;
    orders:{x:number,y:number,r:number,a:number}[]
  }



  runBot(bubbles:{x:number,y:number,r:number,a:number}[]){
    let history = this.history;
    if(!history.length) this.history = bubbles;
    else{

      let last = history[history.length-1].x;
      console.log(' was last '+ last +'  now last '+ bubbles[bubbles.length - 1].x);

      let newData = bubbles.filter(function (o) {
        return o.x > last;
      });

      console.log(' new data ' + this.calculateLength(newData) + ' min');

      console.log('adding new orders '+ newData.length + ' hisyoty length '+ this.history.length);

      this.history =  this.removeOldAndSmallBubbles(history.concat(newData));

    }

    this.saveHistory();

    //console.warn('running bot', bubbles);

  }

  downloadHistoryTimeout;
  redownloadHistory(){

    this.downloadHistory((err, bubbles:{x:number,y:number,r:number,a:number}[])=>{

      let delay = 20000;
      if(!err){

        if(bubbles.length){
          let diff = bubbles[bubbles.length-1].x - bubbles[0].x;
          console.warn(diff);
          delay = Math.round(diff/2);
          if(delay<20000) {
            console.warn('delay ' + delay);
            delay = 20000;
          }

          this.runBot(bubbles)
        }
      }

      console.log(' reload in '+ (delay/1000/60).toPrecision(4) + ' min');

      this.downloadHistoryTimeout = setTimeout(()=>{
        this.redownloadHistory();
      }, delay );

    });
  }



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
    this.currentAPI.getPriceForBase(ar[0]).then(res=>{

      console.warn(res);
      if(!res) return;
      // console.warn(res);

      this.currentAPI.getRate(base, coin).then(rate=>{

        this.amountBase =  +(this.amountUS / res).toPrecision(8);

        this.marketInit = {
          priceBaseUS:res,
          rate:rate,
          coin:coin,
          base:base,
          market:pair,
          exchange:this.currentAPI.exchange
        };

        console.log('market Init ', this.marketInit);
        this.setBalances();
        clearTimeout(this.downloadHistoryTimeout);

      this.redownloadHistory();

      })


    }).catch(err=>{

      console.error('cant get price for base ' +ar[0], err)

    });

  }

}
