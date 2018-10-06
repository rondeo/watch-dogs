import {Component, OnInit, ViewChild} from '@angular/core';
import {VOBalance, VOBooks, VOMarket, VOOrder} from '../../models/app-models';
import {Subscription} from "rxjs/Subscription";
import {ActivatedRoute} from "@angular/router";
import {ConnectorApiService} from "../services/connector-api.service";
import {ApiBase} from "../services/apis/api-base";
import {Observable} from "rxjs/Observable";
import {MatSnackBar} from "@angular/material";
import {UtilsOrder} from "../../com/utils-order";
import {placeOrder} from "./place-order";
import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApiPublicAbstract} from '../../apis/api-public/api-public-abstract';
import {UtilsBooks} from '../../com/utils-books';
import {ApisPublicService} from '../../apis/apis-public.service';

@Component({
  selector: 'app-my-buy-sell',
  templateUrl: './my-buy-sell.component.html',
  styleUrls: ['./my-buy-sell.component.css']
})

export class MyBuySellComponent implements OnInit {


  exchange: string;
  market: string;
  coin:string;
  base: string;

  amountUS: number = 100;
  userRate: number;

  isBuyDisabled = false;
  isSellDisabled = false;



  rateBuy: number;
  rateSell: number;
  bookBuy: number;
  bookSell: number;

  bookBuy1000US: number;
  bookSell1000US: number;


  //priceBaseUS:number;
  amountBase:number = 0;

 /////////////////////
  priceCoin:number;
  amountCoin:number;
  balanceBase: VOBalance;
  balanceCoin: VOBalance;

 // marketInit:{base:string, coin:string, exchange:string, priceBaseUS:number, rate:number, market:string} = {base:'', coin:'', exchange:'', market:'',priceBaseUS:0, rate:0};



  constructor(
    private route:ActivatedRoute,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private snackBar:MatSnackBar,
    private marketCap: ApiMarketCapService
  ) {

  }


  onUserPriceChanged(rate) {

  }

  async downloadBooks() {
    if (!this.market || !this.exchange) return;
    const ar = this.market.split('_');
    const api: ApiPublicAbstract = this.apisPublic.getExchangeApi(this.exchange);
    const books: VOBooks = await api.downloadBooks2(this.market).toPromise();

    this.bookBuy = books.buy[0].rate;
    this.bookSell = books.sell[0].rate;
    const MC = await this.marketCap.getTicker();
    const priceCoin = MC[ar[1]].price_usd;
    const amountCoin1000 = 1000 / priceCoin;
    this.bookBuy1000US = UtilsBooks.getRateForAmountCoin(books.buy, amountCoin1000);
    this.bookSell1000US = UtilsBooks.getRateForAmountCoin(books.sell, amountCoin1000);
    this.showRate();
  }

  private showRate() {

    if (this.focusBuy === 'first') this.rateBuy = this.bookBuy;
    else if (this.focusBuy === 'b1000') this.rateBuy = this.bookBuy1000US;
    if (this.focusSell === 'first') this.rateSell = this.bookSell;
    else if (this.focusSell === 'b1000') this.rateSell = this.bookSell1000US;
  }

  focusBuy = 'first';
  focusSell = 'first';



  onFocusBuy(field: string) {
    // console.log(field);
    this.focusBuy = field;
    this.showRate();
  }

  onFocusSell(field: string) {
    this.focusSell = field;
    this.showRate();
  }

  onBuyClick(){
    let action = 'BUY';
    /*let rate = this.booksComponent.rateToBuyUS/this.marketInit.priceBaseUS
    let amountBase:number = +this.amountUS/this.marketInit.priceBaseUS;
    if(amountBase > this.balanceBase) amountBase = this.balanceBase - (this.balanceBase* 0.0025);
    let amountCoin =  amountBase/rate;
    this.processAction(orderType, amountCoin, rate);*/
  }

  onSellClick(){
    let action = 'SELL';
    /*let rate = this.booksComponent.rateToSellUS/this.marketInit.priceBaseUS;
    let amountCoin =  +this.amountUS/this.marketInit.priceBaseUS/rate;
    if(amountCoin > this.balanceCoin) amountCoin  = this.balanceCoin - (this.balanceCoin * 0.0025);

    this.processAction(orderType, amountCoin, rate);*/
  }

  newOrder:VOOrder;

  private sub1:Subscription;
  private sub2:Subscription;
  private sub3:Subscription;
  ngOnDestroy(){
   this.unsubscribe();
  }


  marketHistoryData:{priceBaseUS:number, history:VOOrder[]};
  marketSummaryData:{summary:VOMarket, priceBaseUS:number}

  //marketSummary:VOMarket;


  unsubscribe(){
    if(this.sub1) this.sub1.unsubscribe();
    if(this.sub2) this.sub2.unsubscribe();
    if(this.sub3) this.sub3.unsubscribe();
  }

 subscribe(){
    this.unsubscribe();
    if(!this.exchange || ! this.market) return;
    const ar = this.market.split('_');
    this.base = ar[0];
    this.coin = ar[1];

    this.marketCap.getTicker().then(MC =>{
      const api: ApiPrivateAbstaract = this.apisPrivate.getExchangeApi(this.exchange);

      api.balance$(ar[0]).subscribe(balance =>{
        if(ar[0] === 'USDT') MC[ar[0]].price_usd = 1;
        this.balanceBase = balance;
        //this.balanceBaseUS = +(balance.available + MC[ar[0]].price_usd).toPrecision(0);
      });

      api.balance$(ar[1]).subscribe(balance =>{
        this.balanceBase = balance;
        //this.balanceCoinUS = +(balance.available + MC[ar[1]].price_usd).toPrecision(0);

      });
    });
   this.downloadBooks();
  }
  ngOnInit() {
    this.sub1 = this.route.params.subscribe(params=>{
      console.log(params);
      this.exchange = params.exchange;
      this.market = params.market;
     this.subscribe();
    });


  }


  onAmountChanged(amount){

  }


}
