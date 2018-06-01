import { Component, OnInit } from '@angular/core';
import {GainersService} from "../bot/gainers.service";
import {ConnectorApiService} from "../../src/app/my-exchange/services/connector-api.service";
import {VOBalance, VOBooksStats, VOMarket, VOMarketCap, VOOrder} from "../../src/app/models/app-models";
import {MyTradingService} from "../bot/my-trading.service";

import {ApiBase} from "../../src/app/my-exchange/services/apis/api-base";
import {Subscription} from "rxjs/Subscription";
import * as _ from 'lodash';
import {MarketCollectorService} from "../bot/market-collector.service";
import {BuyCoinService} from "../bot/buy-coin.service";
import {FollowCoinService} from "../bot/follow-coin.service";


@Component({
  selector: 'app-my-exchange-bot',
  templateUrl: './my-exchange-bot.component.html',
  styleUrls: ['./my-exchange-bot.component.css']
})
export class MyExchangeBotComponent implements OnInit {


 // botsLimit = 3;
  gainersAr:VOMarketCap[];
  constructor(
    private apiService:ConnectorApiService,
    private gainersService:GainersService,
    private tradingService:MyTradingService,
    private marketCollector:MarketCollectorService,
    private buyCoinService:BuyCoinService,
    private botsService:FollowCoinService
  ) { }



  btcMC:VOMarketCap;
  baseMC:VOMarketCap;
  baseSymbol = 'BTC';
  currentAPI:ApiBase;
  //currentMarket:VOMarket;

  botValueUS:number = 100;

  balanceBase:VOBalance;
  balanceCoin:VOBalance;
  balanceBaseUS:number;
  balanceCoinUS:number;


  buyTest(first:any, reasons:string[]){

    let amountBase = this.botValueUS/ this.baseMC.price_usd;
    let coinAmount =  amountBase/first.rateLast;




    MarketCollectorService.getBooksStats(this.currentAPI, first.coinMC, first.baseMC)
      .then((booksStats:VOBooksStats)=>{
       // console.log(booksStats);
        let rateToBuy = booksStats.rateToBuy
        let diff = (100*(booksStats.priceToBuyUS - first.priceLastUS) /first.priceLastUS).toFixed(2);

        let priceonBooks = (rateToBuy * first.baseMC.price_usd);

        let priceDiff = +(100 * (priceonBooks - first.coinMC.price_usd)/first.coinMC.price_usd).toFixed(2);

        let reason2 = 'to Buy  priceDiff to  MC '+ priceDiff;

        reasons.push(reason2)
        reasons.push(' total US in orders '+first.totalUS);
        //console.warn(diff);

        let fakeOrder:VOOrder = {
          uuid:'test'+Date.now(),
          exchange:first.exchange,
          base:first.base,
          coin:first.coin,
          isOpen:false,
          rate:rateToBuy,
          amountCoin:coinAmount,
          action:'BUY',
          timestamp:Date.now()
        }


        this.botsService.followCoin(this.currentAPI,first, fakeOrder, reasons);

      })




  }

  sellCurrentCoin(){

  }

  ngOnDestroy(){
    if(this.sub) this.sub.unsubscribe();
    if(this.sub1) this.sub1.unsubscribe();
    if(this.subGainers) this.subGainers.unsubscribe();
  }

  private sub;
  private sub1;


  ngOnInit() {

    this.botsService.loadBots();

    this.sub1 = this.apiService.connector$().subscribe(connector=> {
      if (!connector) return;
      this.currentAPI = connector;
      this.checkBalanceBase();

    });
  }

  checkBalanceBase(){

    this.currentAPI.getBalance(this.baseSymbol).then(balance=>{

      this.balanceBase = balance;

      if(balance.balanceUS > this.botValueUS ){
        console.log(' got balance subscribing for gainers');
        this.subscribeFoGainers();
      }else console.log(' no balances on base');
    })

  }

  subGainers:Subscription;

  subscribeFoGainers(){

   this.subGainers =  this.gainersService.gainersCoins$().subscribe(gainers=>{

     this.gainersAr = gainers;

     console.log('gainers ', gainers);
      this.baseMC = this.gainersService.getMC(this.baseSymbol);
      this.btcMC = this.gainersService.getMC('BTC');

      this.analyzeGainers(gainers);
    });

  }


/*  testRun(marketSummary:IOrdersStats, order:VOOrder, reason:string){
    console.log(' runing test ', order);

    this.botsService.followCoin(this.currentAPI, marketSummary.coinMC, order, this.baseMC.price_usd, marketSummary, reason);


  }*/


  buyCoin(marketSummary:any, reason:string):void{

    let amountBase = this.botValueUS/ marketSummary.priceBaseUS;
    let coinAmount =  amountBase/marketSummary.rateLast;
    let base = marketSummary.base;
    let coin = marketSummary.coin;
    let rate = marketSummary.rateLast;

    /*this.buyCoinService.tradeCoin(this.currentAPI, 'BUY', base, coin, coinAmount, rate)
      .then(order=>{
        console.warn(order);

        order.marketStats = marketSummary;

        this.botsService.followCoin(this.currentAPI, marketSummary.coinMC, order, this.baseMC.price_usd, marketSummary, reason);

      }).catch(err=>console.error);*/
  }


  reason:string = 'priceToMC';

  summaries:any[];

  analyzeGainers(gainers:VOMarketCap[]){

      if(gainers.length ===0) {
        console.log(' no gainers');
        return;
      }

      let existing = this.botsService.getExistingsBots();

      if(existing.length > 3){
        console.log(' FULL ');
        return;

      }

      let baseID = this.currentAPI.exchange +'_' + this.baseMC.symbol;


      let newCoins =  gainers.filter(function (item) {
        let id = baseID +'_' + item.symbol;
        return  existing.indexOf(id) ===-1;
      });

    if(newCoins.length ===0) {
      console.log(' no new coins');
      return;
    }

console.log(' newCoins   ', newCoins.map(function (item) { return item.symbol}));


      this.marketCollector.collectMarketHistories(this.currentAPI, newCoins, this.baseMC,(summary:any[])=>{

        summary.forEach(function (item) {
          //item.priceToBuyUS = +item.priceToBuyUS.toPrecision(4);
          item.perHourBuy =+(item.perHourBuy/1000).toPrecision(4);
          item.totalUS = +(item.totalUS/1000).toPrecision(4);

        });

        let priceToMC = _.orderBy(summary, 'priceToMC');

        let volume =  _.orderBy(summary, 'totalUS');

        this.summaries = volume;

        if(volume.length){
          let first = this.summaries[0];
          if(first.totalUS < 0)  this.buyTest(first,['priceToMC '+ first.priceToMC + ' totalUS '+ first.totalUS] )
        }



      })



  }







 /* isCurrentCoinDown():boolean{
    if(!this.currentMarket) return false;
    let allCoins = this.gainersService.allCoins;
    let currentCoin = this.currentMarket.coin;
    let MC:VOMarketCap = allCoins.find(function (item) {
      return item.symbol === currentCoin;
    });

    return MC.percent_change_1h < 0;
  }*/

/*
  setBalances(callback){

    let base =  this.currentMarket.base;
    let coin = this.currentMarket.coin;

    let priceBaseUS = this.currentMarket.priceBaseUS;
   let rate = this.currentMarket.rate;
    //console.warn('setBalances');
    this.currentAPI.getBalance(base).then(balB=> {

      this.currentAPI.getBalance(coin).then(balC=> {

        this.balanceBase = balB;
        this.balanceCoin = balC;
       this.balanceBaseUS  = +(balB.balance * priceBaseUS).toFixed(2);
       this.balanceCoinUS =  +(balC.balance * rate * priceBaseUS).toFixed(2);
        callback();
      });

    });

  }*/


}
