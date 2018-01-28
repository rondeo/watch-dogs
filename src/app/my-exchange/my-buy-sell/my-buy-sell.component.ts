import {Component, OnInit, ViewChild} from '@angular/core';
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
import {MyBooksComponent} from "../my-books/my-books.component";

@Component({
  selector: 'app-my-buy-sell',
  templateUrl: './my-buy-sell.component.html',
  styleUrls: ['./my-buy-sell.component.css']
})
export class MyBuySellComponent implements OnInit {


  @ViewChild(MyBooksComponent)
    private booksComponent:MyBooksComponent;


  base:string;
  coin:string;

  /////////////////
  market:string;
  priceBaseUS:number;
  amountBase:number = 0;

 /////////////////////
  priceCoin:number;
  amountCoin:number;


  isSetOrder:boolean = false;
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


  marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, pair:string};

  private pair;
  constructor(
    private route:ActivatedRoute,
    private apiService:ConnectorApiService,
    private snackBar:MatSnackBar
  ) {

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



  onBuyClick(){
    let action = 'BUY';
    this.processAction(action);
  }

  onSellClick(){
    let action = 'SELL';
    this.processAction(action);
  }

  newOrder:VOOrder;
  processAction(action){

    let amountBase = this.amountUS / this.priceBaseUS;

    //console.log(action, amountBase, isMax);

    action = action.toUpperCase();

    let base:string = this.base;
    let coin:string = this.coin;
    // let balanceCoin = this.balanceCoin;
    let priceBaseUS = this.priceBaseUS;

    if((amountBase * priceBaseUS) <10){
      this.snackBar.open(' You have '+ (amountBase * priceBaseUS).toFixed(0) + ' min $10 ','x', {duration:3000, extraClasses:'alert-red'});
      return
    }

    console.log('amountBase ' + amountBase + ' priceBaseUS ' + priceBaseUS );

    let rateToBuyUS = this.booksComponent.rateToBuyUS;
    let rateToSellUS = this.booksComponent.rateToSellUS;

    console.warn(rateToBuyUS, rateToSellUS);


    let rateToBuy = rateToBuyUS / this.priceBaseUS;//// this.rates.rateToBuy;
    let rateToSell = rateToSellUS / this.priceBaseUS;// this.rates.rateToSell;


    if(!rateToBuy || !rateToSell){
      this.snackBar.open('Refresh Books! ', 'x', {extraClasses:'alert-red', duration:2000});
      return
    }

      let rate = 0
      let amountCoin = 0;
      if(action === 'SELL'){

        rate = rateToSell;//BooksService.getRateForAmountBase(books.buy, amountBase);
        amountCoin = amountBase / rate
        let balance = this.balanceCoin;
        balance = (balance - (balance * 0.0025));
        if(amountCoin > balance) amountCoin = balance;



      } else {

        let balance = this.balanceBase;
        balance = (balance - (balance * 0.0025));
        if(amountBase > balance) amountBase = balance;
        rate = rateToBuy;//BooksService.getRateForAmountBase(books.sell, amountBase);
        amountCoin = amountBase / rate;
      }

      rate = +(+rate.toFixed(8)).toPrecision(5);
      let amountUS = (amountCoin * rate * priceBaseUS);

      ///rate = parseFloat(rate+'');
      amountCoin = +(amountCoin).toPrecision(5);


      let rateUS = +(rate * priceBaseUS).toPrecision(4);


      // if(rate<1e-3) rate = +(rate.toFixed(8));
      console.log(' rateUS  ' + rateUS + ' rate ' + rate);

      console.log(' amountCoin ' + amountCoin + ' on balance ');

      let amountBaseUS = +(amountBase * priceBaseUS).toFixed(2);


      let feeUS = (amountUS * 0.0025);

      //setTimeout(()=>{

      console.log(action + ' '+base +'_'+ coin + ' '+amountCoin +' '+rate + ' baseUS ' + this.priceBaseUS);

        if(confirm( action +' x '+rateUS + ' \n' +coin  +' $'+ amountUS.toFixed(2) +  '\nFee: $' + feeUS.toFixed(2))){

         // let service:APIBuySellService = this.privateService;
          let obs:Observable<VOOrder>;


          if(action ==='SELL') obs =  this.currentAPI.sellLimit(base, coin, amountCoin, rate );
          else if(action ==='BUY')obs = this.currentAPI.buyLimit(base, coin, amountCoin, rate );

          if(!obs) {
            console.error(action);
            return;
          }

          obs.subscribe((res:VOOrder)=>{

            console.log(res);
            if(res && res.uuid){

              let order = {
                action:action,
                uuid:res.uuid,
                isOpen:true,
                base:base,
                coin:coin,
                amountBase:amountBase,
                amountCoin:amountCoin,
                rate:rate,
                fee:feeUS,
                priceBaseUS:priceBaseUS
              };

              this.newOrder = order;

              let msg = action + ' ' + coin + ' $' +amountUS.toFixed(0);

              this.snackBar.open('Order Set! '+msg, 'x', {extraClasses:'alert-green', duration:2000});
            } else{
              this.snackBar.open('Error '+res.message, 'x', {extraClasses:'alert-red', duration:3000})
            }

          }, error=>{
            this.snackBar.open('Error '+ error.message, 'x',{extraClasses:'alert-red'});
          })

        }

   // })
  }

  onOrderComplete(order:VOOrder){
    console.warn(order)
    let amountBase = order.amountCoin * order.rate;
    let action = order.action;
    let amountUS  = amountBase * this.priceBaseUS;
    this.snackBar.open('Order Complete! '+action +' ' +order.coin+' $'+amountUS.toFixed(2), 'x', {duration:3000, extraClasses:'alert-green'});
    if(this.currentAPI)this.currentAPI.refreshBalances();
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
   });

    if(!baseBal){
      baseBal = new VOBalance();
      baseBal.balance = 0;
      baseBal.balanceUS = 0;
    }



    let coin = this.coin;

    let coinBal:VOBalance = this.balances.find(function (item) {
      return item.symbol === coin;
    })

    if(!coinBal){
      coinBal = new VOBalance()
      coinBal.balance = 0;
      coinBal.balanceUS = 0;
    }

    this.balanceBase = baseBal.balance;

    this.balanceCoin = coinBal.balance;


    this.priceBaseUS = baseBal.priceUS;
    this.amountBase = +(this.amountUS /baseBal.priceUS).toPrecision(8);

    this.balanceBaseUS = baseBal.balanceUS;

    this.balanceCoinUS = coinBal.balanceUS;
  }

  downloadHistory(){
    console.warn(this.marketInit)
    if(!this.marketInit) return;
    let cur = this.marketInit;

   let sub1 =  this.currentAPI.downloadMarketHistory(cur.base, cur.coin).subscribe(history=>{

     //console.warn(history)
     if(!history) return

      let data:MarketHistoryData = {
        history:history,
        priceBaseUS:this.priceBaseUS
      };

      this.marketHistoryData = data;
      sub1.unsubscribe()
    })

    let sub2 = this.currentAPI.getMarketSummary(cur.base, cur.coin).subscribe(marketSummary=>{
      if(!marketSummary) return;
      setTimeout(()=>sub2.unsubscribe(), 100);
      this.marketSummaryData = {
        summary:marketSummary,
        priceBaseUS:this.priceBaseUS
      }

    })
  }

  onMarketChange(){
    let pair = this.pair;
    if(!pair || pair.indexOf('_') ===-1) return;


    let ar =  pair.split('_');

     // this.modelBuySell.market = pair;
      this.base = ar[0];
      this.coin = ar[1];
      this.market = this.base+'_' + this.coin;
      this.marketInit = null;

      this.currentAPI.getPriceForBase(this.base).then(res=>{
        this.priceBaseUS = res;

        this.marketInit = {
          priceBaseUS:res,
          coin:this.coin,
          base:this.base,
          pair:pair,
          exchange:this.currentAPI.exchange
        }
        console.log('market Init ', this.marketInit);
        this.setBalances();
        this.downloadHistory();
      }).catch(err=>{
        this.downloadHistory();
        this.priceBaseUS = 0
      });

  }

  speedMin = 0
  durationInMin:number = 0;
  //durationMin = 0;
  onDurationMin(min){

   // this.durationMin = min.durationMin;
    let speed = min.speedMin;
    let duration = min.durationMin;


    this.speedMin = speed<10?speed.toFixed(2):speed.toFixed(0);

    setTimeout(()=>{
      this.durationInMin = duration<10?duration.toFixed(2):duration.toFixed(0);;
    }, 200)

  }

  onRefreshBooks:number
  downlaodBooks(){
    this.onRefreshBooks = Date.now();
  }
  onRfreshHistory(evt){

   // console.warn(evt)
    this.durationInMin = 0;
    this.downloadHistory();
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
      this.sub1 = this.route.params.subscribe(params=>{
        this.pair = params.market;
        this.onMarketChange();
      });

      this.currentAPI.balances$().subscribe(balances=>{
        this.balances = balances;
        //  console.log(balances);
        this.setBalances()
      });



/*

      this.sub3 = connector.marketHistory$().subscribe(history=>{
       // console.log(history);
        let data:MarketHistoryData = {
          history:history,
          priceBaseUS:this.priceBaseUS,
          marketSummary:this.marketSummary
        }

       this.marketHistory = data;
      });
*/

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
