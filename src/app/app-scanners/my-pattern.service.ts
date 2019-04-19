import { Injectable } from '@angular/core';
import {ApisPublicService} from '../adal/apis/api-public/apis-public.service';
import {ApiMarketCapService} from '../adal/apis/api-market-cap.service';
import {VOMarketCap} from '../amodels/app-models';
import {Subject} from 'rxjs/internal/Subject';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class MyPatternService {


  interval;
  isScanning$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor(
    private apis: ApisPublicService,
    private mc: ApiMarketCapService

  ) { }

  stopScan(){
    this.isScanning$.next(false);
  }

  async startScan(){
    this.isScanning$.next(true);
    if(this.interval) return;

    const api = this.apis.getExchangeApi('binance');
    const markets = await api.getMarkets();


    const sub: Subject<any> = new Subject();

    const mc: VOMarketCap[] = Object.values(await this.mc.getTicker())
      .filter(function (item) {
      return item.rank < 300 && item.percent_change_7d > 0;
    });

    const myMarkets = [];
    mc.forEach(function (item) {
      if(markets['BTC_' + item.symbol])  myMarkets.push('BTC_' + item.symbol);
    });
    myMarkets.reverse();

    this.next(myMarkets, sub);
    console.log('starting scan ' + myMarkets.length);
   this.interval =  setInterval(() => this.next(myMarkets, sub), 5000)
    return sub;
  }

  private async next(markets: string[], sub: Subject<any>) {
   // console.log(markets);
    if(!this.isScanning$.getValue()) {
     //  console.log('scan stopped');
      return ;
    }
    const market = markets.shift();
    if(!market) {
      sub.complete();
      clearInterval(this.interval);
      this.interval = null;

      console.log('scan complete');
      return
    }

   // const api = this.apis.getExchangeApi('binance');
   //const candles = await api.downloadCandles(market, inteval, 100);
   sub.next(market);
  //  setTimeout(() => this.next(markets, sub), 5000);
  }
}
