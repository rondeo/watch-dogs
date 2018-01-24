import { Component, OnInit } from '@angular/core';
import {VOBalance, VOMarket, VOOrder} from "../../models/app-models";
import {Subscription} from "rxjs/Subscription";
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../services/connector-api.service";
import {ApiBase, VOBooks} from "../services/api-base";
import {APIBuySellService} from "../../services/buy-sell.service";
import {Observable} from "rxjs/Observable";
import {BooksService} from "../../services/books-service";
import {MatSnackBar} from "@angular/material";
import {MarketHistoryData} from "../market-history-line/market-history-line.component";

@Component({
  selector: 'app-my-buy-sell',
  templateUrl: './my-buy-sell.component.html',
  styleUrls: ['./my-buy-sell.component.css']
})
export class MyBuySellComponent implements OnInit {


  base:string;
  coin:string;

  /////////////////
  market:string;
  priceBaseUS:number;
  amountBase:number = 1;

 /////////////////////
  priceCoin:number;
  amountCoin:number;


  amountUS:number = 100;
  //amountBaseUS:number;
  //amountCoinUS:number;

  balanceBase:number;
  balanceCoin:number;
  balanceBaseUS:number;
  balanceCoinUS:number;

  rate:number;

  selectMarket:VOMarket[];

  ordersHistory:VOOrder[];

  marketsArAll:VOMarket[];

  balances:VOBalance[];
  currentAPI:ApiBase;


  private pair;
  constructor(
    private route:ActivatedRoute,
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) { }












  onBuyClick(){
    if(!this.rates){
      console.warn('download books first')
      return
    }
    let action = 'Buy';

    let balance = this.balanceBase;

    let amounBase = this.amountUS / this.priceBaseUS;

    let isMax = (amounBase > balance);
    if(isMax) amounBase = (balance - (balance * 0.0025));
    this.processAction(action, amounBase, isMax);
  }

  onSellClick(){

    if(!this.rates){
      console.warn('download books first');
      return
    }
    let action = 'Sell';
    let balance = this.balanceCoin;
    let rate = this.rates.rateToSell;

    let amountBase = this.amountUS / this.priceBaseUS;



    let amountCoin = amountBase / rate;




    let isMax = (amountCoin > balance);

    if(isMax){
      amountBase = (balance-(balance * 0.0025) )/ rate;
    }

    this.processAction(action, amountBase, isMax);

  }

  currentOrder:VOOrder;
  processAction(action,  amountBase, isMax){
    console.log(action, amountBase, isMax);


    let base:string = this.base;
    let coin:string = this.coin;
    // let balanceCoin = this.balanceCoin;
    let priceBaseUS = this.priceBaseUS;

    if((amountBase * priceBaseUS) <10){
      this.snackBar.open(' You have '+ (amountBase * priceBaseUS).toFixed(0) + ' min $10 ','x', {duration:3000, extraClasses:'alert-red'});
      return
    }

    //let amountBase = +(amountUS / priceBase).toFixed(8);

    console.log('amountBase ' + amountBase + ' priceBaseUS ' + priceBaseUS );

    this.currentAPI.downloadBooks(this.base,  this.coin);

    let subBooks = this.currentAPI.books$().subscribe((books:VOBooks)=>{
      subBooks.unsubscribe();

      let rate = 0
      let amountCoin = 0;
      if(action === 'Sell'){
        rate = BooksService.getRateForAmountBase(books.buy, amountBase);
        amountCoin = amountBase / rate
        let balance = this.balanceCoin;
        balance = (balance - (balance * 0.0025));
        if(amountCoin > balance) amountCoin = balance;



      } else {
        let balance = this.balanceBase;
        balance = (balance - (balance * 0.0025));

        if(amountBase > balance) amountBase = balance;
        rate = BooksService.getRateForAmountBase(books.sell, amountBase);
        amountCoin = amountBase / rate;
      }

      rate = parseFloat(rate+'');
      amountCoin = +(amountCoin).toPrecision(5);


      let rateUS = +(rate * priceBaseUS).toPrecision(4);


      // if(rate<1e-3) rate = +(rate.toFixed(8));
      console.log(' rateUS  ' + rateUS + ' rate ' + rate);

      console.log(' amountCoin ' + amountCoin + ' on balance ');

      let amountBaseUS = +(amountBase * priceBaseUS).toFixed(2);

      let fee = (amountBaseUS * 0.0025).toFixed(2);

      //setTimeout(()=>{

      console.log(action + ' '+base +'_'+ coin + ' '+amountCoin +' '+rate);

        if(confirm( action +' x '+rateUS + ' \n' +coin  +' $'+ amountBaseUS +  '\nFee: $' + fee)){

         // let service:APIBuySellService = this.privateService;
          let obs:Observable<VOOrder>;


          if(action ==='Sell') obs =  this.currentAPI.sellLimit(base, coin, amountCoin, rate );
          else if(action ==='Buy')obs = this.currentAPI.buyLimit(base, coin, amountCoin, rate );

          if(!obs) {
            console.error(action);
            return;
          }

          obs.subscribe((res:VOOrder)=>{

            console.log(res);
            if(res && res.uuid){

              this.currentOrder = res;

              //this.startCheckingOrder(res.uuid);
              this.snackBar.open('Order Set. Checking...'+res.message || '', 'x', {extraClasses:'alert-green', duration:2000});
            } else{
              this.snackBar.open('Error '+res.message, 'x', {extraClasses:'alert-red', duration:3000})
            }

          }, error=>{
            this.snackBar.open('Error '+ error.message, 'x',{extraClasses:'alert-red'});
          })

        }
      //}, 200);


      //this.modelBuySell.balanceCoin


    })
  }



  onAmountChanged(evt){
      if(!this.priceBaseUS) return;
      let amountBase = +(this.amountUS / this.priceBaseUS).toPrecision(8);
    console.log(amountBase);
      this.amountBase = amountBase ;

  }
  private rates:{amountBas:number, rateToBuy:number, rateToSell:number};
  onRateForAmount(rates){
    console.log(rates);
    this.rates = rates;
  }



  setBalances(){
   if(!this.balances || !this.base || !this.coin) return;
   let base = this.base;
   let baseBal:VOBalance = this.balances.find(function (item) {
     return item.symbol === base;
   })
    let coin = this.coin;
    let coinBal:VOBalance = this.balances.find(function (item) {
      return item.symbol === coin;
    });

    this.balanceBase = baseBal.balance;
    this.balanceCoin = coinBal.balance;

    this.priceBaseUS = baseBal.priceUS;
    this.amountBase = +(this.amountUS /baseBal.priceUS).toPrecision(8);

    this.balanceBaseUS = baseBal.balanceUS;
    this.balanceCoinUS = coinBal.balanceUS;
  }

  downloadHistory(){
    if(!this.base || !this.currentAPI) return;
    this.currentAPI.getMarketSummary(this.base, this.coin).then(res=>{
      console.log(res);
      this.marketSummary = res;
      this.currentAPI.downloadMarketHistory(this.base, this.coin);
    })
  }

  setMarket(){
    let pair = this.pair;
    if(!pair || pair.indexOf('_') ===-1) return;
    console.warn(' setMarket ' + pair);

    let ar =  pair.split('_');

     // this.modelBuySell.market = pair;
      this.base = ar[0];
      this.coin = ar[1];
      this.market = this.base+'_' + this.coin;
      this.currentAPI.getPriceForBase(this.base).then(res=>{
        this.priceBaseUS = res;
        this.downloadHistory();
      }).catch(err=>{
        this.downloadHistory();
        this.priceBaseUS = 0
      })
      this.setBalances();


  }

  durationInMin:number = 0;

  onDurationMin(min){
    setTimeout(()=>{
      this.durationInMin = min;
    }, 200)

  }


  onRfreshHistory(evt){

    console.warn(evt)
    this.durationInMin = 0;
    this.downloadHistory();
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


  marketHistory:MarketHistoryData;
  marketSummary:VOMarket;

  ngOnInit() {



    this.sub2 = this.apiService.connector$().subscribe(connector=>{
      this.currentAPI = connector;
      if(!connector) return;
      this.sub1 = this.route.params.subscribe(params=>{
        this.pair = params.market;
        this.setMarket();
      });

      this.currentAPI.balances$().subscribe(balances=>{
        this.balances = balances;
        //  console.log(balances);
        this.setBalances()
      });


      this.sub3 = connector.marketHistory$().subscribe(history=>{
        console.log(history);
        let data:MarketHistoryData = {
          history:history,
          priceBaseUS:this.priceBaseUS,
          marketSummary:this.marketSummary
        }

       this.marketHistory = data;
      });

      //this.downloadHistory();

      //connector.loadAllMarketSummaries();
      //if(this.subMarkets) this.subMarkets.unsubscribe();
      /*this.subMarkets = connector.marketsAr$().subscribe(res=>{
        this.marketsArAll = res;
        this.setMarket();
      })*/


    })

  }


}
