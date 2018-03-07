import { Component, OnInit } from '@angular/core';
import {ShapeShiftService} from '../shape-shift.service';
import {MarketCapService} from '../../market-cap/market-cap.service';

import * as _ from 'lodash';
import {VOMarketCap} from '../../models/app-models';

@Component({
  selector: 'app-ss-coins-available',
  templateUrl: './ss-coins-available.component.html',
  styleUrls: ['./ss-coins-available.component.css']
})
export class SSCoinsAvailableComponent implements OnInit {

  coinsAvailable:any[];
  coinsSorted:any[];
  markets:{[symbol:string]:VOMarketCap};



  coinFrom:{
    symbol:string;
    US:number,
    amount:number,
    price:number,
    revertUS:number,
    revertAmount:number;
  } = {
    symbol:'',
    US:1000,
    amount:0,
    price:0,
    revertUS:0,
    revertAmount:0
  }

  coinTo:{
    symbol:string,
    US:number,
    amount:number,
    price:number,
    revertUS:number,
    revertAmount:number;
  } ={
    symbol:'',
    US:0,
    amount:0,
    price:0,
    revertUS:0,
    revertAmount:0
  };

  exchange={
    pair:''
  };


  constructor(
    private shapeShiftService:ShapeShiftService,
    private marketCap:MarketCapService

  ) { }

  ngOnInit() {
    this.shapeShiftService.coinsAvailable$.subscribe(res=>{
    //  console.log(res);
      this.coinsAvailable = res;
      this.coinsSorted = _.sortBy(res,'symbol')
      this.merge();
    })

    this.marketCap.coinsAr$.subscribe(res =>{
      if(!res) return


     // console.log(markets)
      this.markets = this.marketCap.getAllCoinsData();

      this.merge()
    })

    this.marketCap.refresh();
  }

  calculateRequest(){

    let symbol = this.coinFrom.symbol;

    let us = +this.coinFrom.US;
    console.log('calculateRequest ' + symbol +'  ' + us);
    if(!symbol || !us) return;

    let market = this.markets[symbol];
    console.log(market);
    if(!market)return;

    let price = market.price_usd;
    this.coinFrom.amount = us / price;
  }

  coinSelectChanged1(evt){

    this.calculateRequest();


  }

  coinSelectChanged2(evt){
    this.calculateRequest();

  }

  onSubmit(){

    //console.log(this.selectedValue1, this.selectedValue2, this.selectedValue3);
    let pair = this.coinFrom.symbol.toLowerCase() +'_'+this.coinTo.symbol.toLowerCase();
    this.exchange.pair = pair;

    let amount = this.coinFrom.amount;

    this.shapeShiftService.getExchangeRate(pair).subscribe(res=>{
      console.log(res);

      let total = (amount-res.minerFee) * res.rate;
     this.coinTo.amount = total;

      let symbol = this.coinTo.symbol;
      let market = this.markets[symbol];
      if(market)  {
        this.coinTo.US = +(total * market.price_usd).toFixed(2);
       this.getRevert();
      }


    })

  }

  getRevert(){

    this.coinTo.revertUS = this.coinFrom.US;


    let pair = this.coinTo.symbol.toLowerCase() +'_'+this.coinFrom.symbol.toLowerCase();

    let symbol = this.coinTo.symbol;
    let market = this.markets[symbol];
    if(!market){
      console.error(' market ' + market);
    }

    let price = market.price_usd;

    let amount = this.coinTo.revertUS / price;

    this.coinTo.revertAmount = amount;


    this.shapeShiftService.getExchangeRate(pair).subscribe(res=>{
      console.log(res);
      let total = (amount-res.minerFee) * res.rate;

     let symbol = this.coinFrom.symbol;
      console.log(total);
      let market = this.markets[symbol];

      if(market)  {

        this.coinFrom.revertAmount = total;

        this.coinFrom.revertUS = +(total * market.price_usd).toFixed(2);


      }


    })

  }

  private merge() {
    if (this.markets && this.coinsAvailable) {
      let all = this.markets;
      // console.log(all);
      let ar = this.coinsAvailable;

      ar.forEach(function (item) {
        let market = all[item.symbol];
        if (market) {
          item.percent_change_1h = market.percent_change_1h;
          item.percent_change_7d = market.percent_change_7d;
          item.percent_change_24h = market.percent_change_24h;
          item.name = market.name;
          item.rank = market.rank;
          item.price_usd = market.price_usd;

          item.market = market;
        } else console.warn(' no coin ' + item.symbol)
      })
      this.coinsAvailable = _.orderBy(ar, 'symbol');

    }
  }

}
