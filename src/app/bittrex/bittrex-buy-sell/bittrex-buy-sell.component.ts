import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {VOBalance, VOMarket, VOMarketB, VOMarketCap, VOOrderBook, VOTransfer} from '../../models/app-models';
import {BittrexPrivateService} from '../bittrex-private.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {Observable} from 'rxjs/Observable';
import {MatSnackBar} from '@angular/material';
import {BittrexService, VOMarketBLite} from '../../exchanges/services/bittrex.service';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Subscription';
import {MappersBooks} from "../../com/mappers-books";

import {MappersHistory, VOHistoryStats} from "../../com/mappers-history";
import {BuySellModel} from "../../models/buy-sell-model";



@Component({
  selector: 'app-bittrex-buy-sell',
  templateUrl: './bittrex-buy-sell.component.html',
  styleUrls: ['./bittrex-buy-sell.component.css']
})

export class BittrexBuySellComponent implements OnInit, OnDestroy {


  priceBase:number;
  priceCoin:number;
  amountCoin:number;

  selectMarket:VOMarket[];

  rateAvarage:number;

  modelBuySell:BuySellModel;


  historyStats:VOHistoryStats;
  marketHistory:VOOrderBook[];
  isHistoryLoading:boolean;
  speedD:string;
  durationD:string;

  historyLength:string;
  isBook:boolean;

  isShowTables:boolean;
 // isInfo:boolean;

  currentBalance:VOBalance;

  balanceBase:VOBalance;
  balanceCoin:VOBalance;

  percentOfLast:number;
  fee:number = 0.0025;

  //action:string = 'Buy';

  baseMarkets:string[];
  base:string;


  symbolMarketsTitle:string;

  //symbolMarkets:VOMarket[];
  transaferMarkets:VOMarket[];

  currentMarket:VOMarket = new VOMarket();
 // usAmount:string;
  usTo:number;
  isOneMarket:boolean;

  progress:number = 20;
  //numMarkets$:Observable<number>;
  isCanBuy:boolean;
  isDisabled:boolean = true;
  isCreateWallet:boolean;

  set last(num:number){
    console.warn(num);
  }

 // marketCapTo:VOMarketCap = new VOMarketCap();
  private marketsArAll:VOMarket[];
  marketsSelected:VOMarket[];

  MC:{[symbol:string]:VOMarketCap};
  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private privateService:BittrexPrivateService,
    private snackBar:MatSnackBar
  )
  {

    this.modelBuySell = new BuySellModel();
    console.log(this.modelBuySell )
  }

  private sub1:Subscription;
  private sub2:Subscription;
  ngOnInit() {
    let sub = this.privateService.marketCap.getCoinsObs().subscribe(res=>{
      if(res){
        this.MC = res;
        this.setPriceBase();
        setTimeout(()=>sub.unsubscribe(),100);
      }
    });
    this.sub1 = this.route.params.subscribe(params=>{
      let pair = params.market;
     this.setMarket(pair);
    });
  }

  isCharging:boolean;
  onChargeAmountChaged(){

  }

  checkCargeAmount(){

  }
  onChargeClick(){
    this.isCharging = !this.isCharging;
    if(!this.isCharging){

      let amountBase = this.balanceBase.balanceUS;
      let amountCoin = this.modelBuySell.balanceCoin.balanceUS;
      if(amountBase + amountCoin < this.modelBuySell.charge){
        this.snackBar.open('Not sufficient founds on your account')
      }else {
        this.modelBuySell.save();
       console.log(' OK ' + this.modelBuySell.charge)
      }
    }
  }

  onBuyClick(){
    console.log('Buy');
  }

  onSellClick(){
    console.log('Sell');

  }
 /* onAmountBaseUSChanged(evt){
    //console.log(this.transfer.amountBaseUS);
  }*/
  populateMarkets(){
    let sub = this.privateService.publicService.getMarketsAr().subscribe(res=>{
      if(!res) return;
      this.marketsSelected = res.filter(function (item) { return item.selected; });

      setTimeout(()=>sub.unsubscribe(),1000);
    });
  }


  setPriceBase(){
    if(this.MC && this.modelBuySell.base)
      this.priceBase = this.MC[this.modelBuySell.base].price_usd;
      this.modelBuySell.priceBase  =  this.priceBase;

   /* let symbol = this.currentBalance.symbol;
    let mc = mcData[symbol];
    console.log(mc)

    this.currentBalance.priceUS = mc.price_usd*/;
    //this.currentBalance.balanceUS = +(this.currentBalance.priceUS * this.currentBalance.available).toFixed(2);
  }



  ngOnDestroy(){
    if(this.sub1)this.sub1.unsubscribe();
    if(this.sub2)this.sub2.unsubscribe();

  }

  onRateAvarage(evt){

    this.priceCoin = parseFloat((evt * this.priceBase).toPrecision(4));
    this.modelBuySell.priceCoin =  this.priceCoin;

    console.log(evt);
  }
  onAmounFromChange(evt){
    if(isNaN(evt)) return;
    //console.log(this.transfer.amountFrom);
    //this.transfer.amountUSFrom = (this.transfer.priceUSFrom * this.transfer.amountFrom) +'';
    //this.calculateTo();
  }

  onAmountUSChange(evt){
    if(isNaN(evt)) return;
    this.updateTransfer();
    //let amountFrom = +(+this.transfer.amountUSFrom/this.transfer.priceUSFrom).toFixed(8);
    //if(amountFrom > +this.currentBalance.balance)amountFrom = +this.currentBalance.balance;
    //this.transfer.amountFrom = amountFrom;
   // this.calculateTo();
  }

 /* calculateFrom(){
    this.transfer.amountFrom =   this.transfer.  * this.transfer.rate:
     // this.transfer.amountTo /this.transfer.rate)
     // .toPrecision(8);

    ///if(this.transfer.priceUS === -1 ) return;
    //this.transfer.amountUSFrom = (this.transfer.amountFrom * this.transfer.priceUS).toFixed(2);
  }*/

 calculateFee(){
  // if(isNaN(this.transfer.amountFrom)) return;
   //this.transfer.fee = this.transfer.amountFrom * 0.0025;
   //this.transfer.feeUS = (this.transfer.fee * this.transfer.priceUSFrom).toFixed(2);
 }


/*
  onAmountCoinChange(evt){
   // this.calculateFrom();
    this.rateAvarage = evt;

  }*/

  refrshBalances(){
    this.privateService.refreshBalances();
  }

  onMarketClick(){
    if(this.marketsSelected) this.marketsSelected = null;
    else  this.populateMarkets();
  }



 populateBalances(){

   let sub = this.privateService.balances$.subscribe(res=>{
     if(!res) return;

     let coin = this.modelBuySell.coin;
     let base = this.modelBuySell.base;

     if(base) this.balanceBase = this.privateService.getBalanceBySumbol(base) || {
       symbol:base,
       balance:0,
       balanceUS:0
     };


     if(coin) {

       let balanceCoin = this.privateService.getBalanceBySumbol(coin) || {
         symbol:coin,
         balance:0,
         balanceUS:0
       };

       this.balanceCoin = balanceCoin;
     }

     this.setPriceBase();
    // this.modelBuySell.amountCoinUS

     setTimeout(()=>sub.unsubscribe(),100);
   })
   this.privateService.loadBalances();
 }

  onMarketSelected(evt:{value:string}){
   this.marketsSelected = null;
   this.router.navigate(['../'+evt.value], {relativeTo: this.route});
  }




  setMarket(pair:string){

   if(!pair) pair = 'undefined';
    let ar =  pair.split('_');
    if(ar.length == 2){
      this.modelBuySell.market = pair;
      this.populateBalances();
      //this.downloadBooks();
     // this.downloadHistory();

    }else {

      this.modelBuySell.market = 'Undefined';
    }
   // this.populateBalances();
    console.log(ar);







  /*  let market:VOMarket = this.symbolMarkets.find(function (item) {
      return item.pair === pair;

    });
*/
    //this.transfer.market = pair;

    //this.setMarketByName(pair);

   /**/
    //this.transfer.rate = market.Last;

   /* this.bitterexPublic.getMarketSummary(market.MarketName).subscribe(market=>{
      console.log(market);
      this.market = market;
      this.setTransfer();
    })
*/


  }


  updateTransfer(){

   /* if(!this.transfer.rate || !this.transfer.amountCoinUS || !this.transfer.market) {
      console.log(this.transfer.rate,this.transfer.amountCoinUS,this.transfer.market);
      return
    };

    this.transfer.amountCoin = +(this.transfer.amountCoinUS / this.balanceCoin.priceUS).toPrecision(6);

    this.transfer.fee = this.transfer.amountCoin * 0.0025;
    this.transfer.feeUS = +(this.transfer.fee / this.balanceCoin.priceUS).toFixed(2);
    let b = this.transfer.amountCoin * this.transfer.rate;

    this.transfer.amountBase = b + (b*0.0025);
    this.transfer.amountBaseUS = +(this.balanceBase.priceUS * this.transfer.amountBase).toFixed(2);
*/




   /* if(this.transfer.action === 'Buy'){
      let amountBaseReqired = (this.transfer.amountCoin * this.transfer.rate) ;
      amountBaseReqired += (amountBaseReqired * 0.0025);

    }*/
    /* this.calculateFee();
     if(!this.currentMarket.pair) return;
     let market = this.currentMarket;*/


    /*
        if(this.transfer.symbolFrom === this.currentMarket.base) {
          this.transfer.action ='Buy';
          this.transfer.symbolTo = market.coin;

          this.transfer.amountTo =   +((this.transfer.amountFrom-this.transfer.fee) /this.transfer.rate).toFixed(8);

        }else{
          this.transfer.action ='Sell';
          this.transfer.symbolTo = market.base;
          this.transfer.amountTo =   +((this.transfer.amountFrom-this.transfer.fee) *this.transfer.rate).toFixed(8);
        }

        let coin = this.privateService.publicService.marketCap.getCoinBySymbol(this.transfer.symbolTo);
        this.transfer.priceUSTo = coin?coin.price_usd:-1;

        this.marketCapTo = coin;

        this.percentOfLast = Math.round((this.transfer.rate - this.currentMarket.Last)/this.currentMarket.Last*100);

        this.transfer.amountUSTo =  (this.transfer.priceUSTo * this.transfer.amountTo).toFixed(2);*/

  }


  /* isShowMarkets:boolean;

  onShowMarketsClick(){
    if(!this.transaferMarkets){
      this.snackBar.open('Downloading Markets ','X', {duration: 3000});
      return
    }
    this.isShowMarkets = !this.isShowMarkets
  }


  onBuySellSelected(option){

    console.log(option);

   // this.initBuySell();
  }

  onGraphMcClick(){
    if(!this.marketCapTo) return;
    let url ="https://coinmarketcap.com/currencies/"+ this.marketCapTo.id;
    window.open(url, '_blank');
  }

  onGraphMarketClick(){
    if(!this.transfer.market) return;
    let url ="https://www.bittrex.com/Market/Index?MarketName="+ this.transfer.market.replace('_','-');
    window.open(url, '_blank');
  }


  onAutoSellClick(){

    let symbol = this.route.snapshot.paramMap.get('symbol');

    this.router.navigateByUrl('/my-bittrex/auto-sell/'+symbol);
  }
*/
  /*
  createNewBalance():VOBalance{
    return {
      available:0,
      balance:0,

    }
  }*/


  /*onAmounBalanceClick() {
    let val = this.currentBalance.balanceUS;
    this.transfer.amountCoinUS = val;
    this.updateTransfer();
  }

  onAvailableClick() {
    let val = this.currentBalance.available;
    let us = this.currentBalance.balanceUS;
    console.log(val, us)

  }

  onAmountBaseClick() {
  // this.transfer.amountBaseUS = this.balanceBase.balanceUS;

    this.transfer.amountCoinUS = this.balanceBase.balanceUS

    this.updateTransfer();
  }

  onAmountCoinClick() {
    this.transfer.amountCoinUS = this.balanceCoin.balanceUS;
    this.updateTransfer();
  }
  onRateClick(rate:string){
    this.transfer.rate = +rate;
    this.updateTransfer();
    //this.calculateTo();
  }


  updateBaseAmount(){

  }
*/

  /*
  onActionClick(){
   // console.log(this.transfer);
   /!* console.log(this.transfer);
    this.transfer.amountFrom = +this.transfer.amountFrom;
    this.transfer.rate = +this.transfer.rate;

    if(isNaN(this.transfer.amountFrom) || !this.transfer.market || isNaN(+this.transfer.rate)){
      console.log(this.transfer);
      let notvalid = 'Amount, Rate and Market has to be fill in';
      alert(notvalid);
    }else{


        let message = 'Request market ' + this.transfer.market+ ' to '+this.transfer.action +
          '\n From: '+  this.transfer.amountFrom.toPrecision(4) +' '+ this.transfer.symbolFrom + ' $'+this.transfer.amountUSFrom +
          '\n Rate: ' + this.transfer.rate.toPrecision(4) +
          "\n To: "+ this.transfer.amountTo+ ' '+ this.transfer.symbolTo + ' $'+this.transfer.amountUSTo +
          "\n Fee:  "+this.transfer.fee.toPrecision(4) + '$ '+  this.transfer.feeUS;


        if(confirm(message)){

          console.log(this.transfer);
          if(this.transfer.action === "Sell"){
            this.privateService.sellLimit(this.transfer.market, this.transfer.amountFrom, this.transfer.rate).subscribe(res=>{
              console.log(res);
              if(res.result && res.result.uuid){
                this.transfer.uuid = res.result.uuid;
                this.transfer.timestamp = Date.now();
                this.privateService.addTransfer(this.transfer);


                this.snackBar.open(res.result.uuid,'x');
              }else this.snackBar.open(res.message,'x');
            });

         }else if(this.transfer.action === 'Buy'){

            this.privateService.buyLimit(this.transfer.market, this.transfer.amountTo, this.transfer.rate).subscribe(res=>{
              console.log(res);
              if(res.result && res.result.uuid){
                this.transfer.uuid = res.result.uuid;
                this.transfer.timestamp = Date.now();
                this.privateService.addTransfer(this.transfer);
                this.snackBar.open(res.result.uuid,'x');
              }else this.snackBar.open(res.message,'x');
            });
          } else alert('Unknown Action ' + this.transfer.action);

        }
    }*!/

  }*/

  /* onInfoClick(){
     if(!this.transaferMarkets){
       this.snackBar.open('Downloading Markets ','X', {duration: 3000});
       return
     }
     if(!this.currentMarket) {
      this.snackBar.open('no Market selected ','X', {duration: 3000});
       return;
     }

     this.isInfo = !this.isInfo;

   }*/

}
