import {Component, OnInit, ViewChild} from '@angular/core';
import {VOBalance, VOMarket, VOOrder} from "../../models/app-models";
import {Subscription} from "rxjs/Subscription";
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../services/connector-api.service";
import {ApiBase} from "../services/apis/api-base";
import {APIBuySellService} from "../../services/buy-sell.service";
import {Observable} from "rxjs/Observable";
import {BooksService} from "../../services/books-service";
import {MatSnackBar} from "@angular/material";
import {MarketHistoryData} from "../market-history-line/market-history-line.component";
import {MyBooksComponent} from "../my-books/my-books.component";
import {UtilsOrder} from "../utils-order";
import {placeOrder} from "./place-order";

@Component({
  selector: 'app-my-buy-sell',
  templateUrl: './my-buy-sell.component.html',
  styleUrls: ['./my-buy-sell.component.css']
})

export class MyBuySellComponent implements OnInit {


  @ViewChild(MyBooksComponent)
    private booksComponent:MyBooksComponent;



  analytics: {
    buy:VOOrder[],
    sell:VOOrder[],
    bubbles:any[],
    min:number,
    max:number,
    sumBuy:number,
    sumSell:number,
    dustCountBuy:number,
    dustCountSell:number,
    fishes:VOOrder[],
    speed:number,
    duration:number,
    tolerance:number
  }

  bubbles:any[];
  //priceBaseUS:number;
  amountBase:number = 0;

 /////////////////////
  priceCoin:number;
  amountCoin:number;


  isSetOrder:boolean = false;
  amountUS:number = 100;

  balanceBase:number;
  balanceCoin:number;
  balanceBaseUS:number;
  balanceCoinUS:number;

 // rate:number;

  selectMarket:VOMarket[];

  ordersHistory:VOOrder[];

  marketsArAll:VOMarket[];

  currentAPI:ApiBase;

  marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, rate:number, market:string} = {base:'', coin:'', exchange:'', market:'',priceBaseUS:0, rate:0};

  private pair;

  constructor(
    private route:ActivatedRoute,
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) {

    this.analytics = {
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
    this.newOrder; /*= {
      isOpen:true,
      uuid:'uuuuu',
      amountBase:0.01,
      amountCoin:300,
      action:'B',
      rate:0.0002,
      base:'',
      coin:'',
      fee:0.009
    }*/


  }



  onFillOrder(order:VOOrder){
    console.log('order fill ', order);
    if(order.uuid === this.newOrder.uuid) this.newOrder = null;
    this.currentAPI.refreshBalances()
  }


  onOpenMarketClick(){
    if(this.marketInit) {
     let url = this.currentAPI.getMarketURL(this.marketInit.base, this.marketInit.coin);
      window.open(url,'_blank');
    }

  }
  isLoadinBalances:boolean;
  onRefreshBalancesClick(){

    this.isLoadinBalances=true;
    this.currentAPI.refreshBalances();

  }

  onBuyClick(){
    let action = 'BUY';
    let rate = this.booksComponent.rateToBuyUS/this.marketInit.priceBaseUS
    let amountBase:number = +this.amountUS/this.marketInit.priceBaseUS;
    if(amountBase > this.balanceBase) amountBase = this.balanceBase - (this.balanceBase* 0.0025);
    let amountCoin =  amountBase/rate;
    this.processAction(action, amountCoin, rate);
  }

  onSellClick(){
    let action = 'SELL';
    let rate = this.booksComponent.rateToSellUS/this.marketInit.priceBaseUS;
    let amountCoin =  +this.amountUS/this.marketInit.priceBaseUS/rate;
    if(amountCoin > this.balanceCoin) amountCoin  = this.balanceCoin - (this.balanceCoin * 0.0025);

    this.processAction(action, amountCoin, rate);
  }

  newOrder:VOOrder;
  processAction(action:string, amountCoin:number, rate:number){

    placeOrder(
      action,
      this.marketInit.base,
      this.marketInit.coin,
      this.marketInit.priceBaseUS,
      +rate.toPrecision(5),
      amountCoin,
      this.balanceBase,
      this.balanceCoin,
      this.currentAPI,
      this.snackBar
    ).then(order=>{
      console.log('new order ', order);
      this.newOrder = order;
    }).catch(console.error);
  }


  onOrderComplete(order:VOOrder){
    console.warn('Order complete ', order);
    let amountBase = order.amountCoin * order.rate;
    let action = order.action;
    let amountUS  = amountBase * this.marketInit.priceBaseUS;
    this.snackBar.open('Order Complete! '+action +' ' +order.coin+' $'+amountUS.toFixed(2), 'x', {duration:3000, extraClasses:'alert-green'});
    if(this.currentAPI)this.currentAPI.refreshBalances();
  }

  onAmountChanged(evt){
      if(!this.marketInit.priceBaseUS) return;
      let amountBase = +(this.amountUS / this.marketInit.priceBaseUS).toPrecision(8);
    console.log(amountBase);
      this.amountBase = amountBase ;

  }
  private rates:{amountBas:number, rateToBuy:number, rateToSell:number};
  onRateForAmount(rates){
    console.log(rates);

    this.rates = rates;
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

  downloadMarketSummary(){
    let cur = this.marketInit;
    let sub2 = this.currentAPI.getMarketSummary(cur.base, cur.coin).subscribe(marketSummary=>{
      if(!marketSummary) return;
      setTimeout(()=>sub2.unsubscribe(), 100);
      this.marketSummaryData = {
        summary:marketSummary,
        priceBaseUS:this.marketInit.priceBaseUS
      }

    })
  }

  downloadHistory(callBack:(err, res)=>void){
    if(!this.marketInit) return;
    let cur = this.marketInit;
   let sub1 =  this.currentAPI.downloadMarketHistory(cur.base, cur.coin).subscribe(history=>{
     //console.log(history);
     if(!history) return;
     this.analytics = UtilsOrder.analizeOrdersHistory(history, this.marketInit.priceBaseUS);
      sub1.unsubscribe()
     callBack(null, history);
    });



  }

  onMarketChange(){
    let pair = this.pair;
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
          this.downloadHistory((err, res)=>{

          });

        })


      }).catch(err=>{

        console.error('cant get price for base ' +ar[0], err)

      });

  }

  speedMin = 0
  durationInMin:number = 0;

  onRefreshBooks:number
  downlaodBooks(){
    this.onRefreshBooks = Date.now();
  }
  isRefreshingHistory
  onRefreshHistory(){
  this.isRefreshingHistory = true;
   // console.warn(evt)
   // this.durationInMin = 0;
    this.downloadHistory((err, res)=>{
      this.isRefreshingHistory = false;
    });
    this.downlaodBooks();

  }


  tolerance:string;
  onTolerance(tolerance:number){
    this.tolerance = tolerance.toFixed(2);
  }

  private sub1:Subscription;
  private sub2:Subscription;
  private sub3:Subscription;
  private subMarkets:Subscription;
  ngOnDestroy(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
    if(this.sub3) this.sub3.unsubscribe();
  }


  marketHistoryData:{priceBaseUS:number, history:VOOrder[]};
  marketSummaryData:{summary:VOMarket, priceBaseUS:number}

  //marketSummary:VOMarket;

  ngOnInit() {

    this.sub2 = this.apiService.connector$().subscribe(connector=>{
      this.currentAPI = connector;
      if(!connector) return;

      this.currentAPI.balances$().subscribe(balances=>{
        this.setBalances();
      });


      this.sub1 = this.route.params.subscribe(params=>{
        console.log(params)
        this.pair = params.market;
        this.onMarketChange();
      });

    })

  }


}
