import {Injectable} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {MarketCapService} from "../../market-cap/services/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {VOBalance, VOMarket, VOMarketCap, VOWatchdog} from "../../models/app-models";
import {ApisPublicService} from "../../apis/apis-public.service";
import {ApisPrivateService} from "../../apis/apis-private.service";
import * as moment from "moment";
import {StorageService} from "../../services/app-storage.service";
import {Subject} from "rxjs/Subject";

import * as _ from 'lodash';
import {WatchDog} from "./watch-dog";


@Injectable()
export class BotSellCoinService {

  toSell: WatchDog[] = [];

  soldCoinSub: Subject<WatchDog> = new Subject()

  soldCoin$() {
    return this.soldCoinSub.asObservable();
  }

  constructor(
    private http: HttpClient,
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private storage: StorageService
  ) {

    setInterval(()=>this.tryAgain(), 60000);
  }


  trackCoin(coin: WatchDog) {

    this.apisPrivate.getExchangeApi(coin.exchange).getOrder(coin.uuid).subscribe(res => {
      console.warn(res);
    })

  }

  tryAgain(){
    if(this.toSell.length === 0) return;

    const sellCoin = this.toSell.pop();
    this.sellCoin(sellCoin);
  }

  sellCoin(sellCoin: WatchDog): boolean {
    const exists = this.toSell.find(function (item) {
      return item.exchange === sellCoin.exchange && item.base === sellCoin.base && item.coin === sellCoin.coin;
    });

    if (exists) return false;


    this.apisPrivate.getExchangeApi(sellCoin.exchange)
      .sellCoin(sellCoin)
      .subscribe((coin: WatchDog) => {


        console.warn('SELL COIN RESULT ', coin);
        if (!coin.balanceCoin) {
          coin.results.push(moment().format() + ' balance 0');

          this.toSell =   _.reject(this.toSell, {exchange: coin.exchange, base: coin.base, coin: coin.coin});
          this.soldCoinSub.next(coin);

        }else this.toSell.push(sellCoin);

       /* this.saveOnServer(coin.exchange + coin.coin, coin).then(res => {
          console.warn(res);
        })*/
      }, err=>{

        this.toSell.push(sellCoin);
      })

    return true;

  }

/*
  saveOnServer(filename: string, payload: WatchDog) {
    payload.date = moment().format();

    let url = 'api/save-data/';
    console.log(url);
    return this.http.post(url, {filename, payload}).toPromise();

  }*/


  private _markets: any[];
  get markets() {
    if (!this._markets) this._markets = JSON.parse(localStorage.getItem('bot-sell-coin') || '[]');
    return this._markets;
  }


  addMarket(exchange: string, base: string, coin: string) {
    let id = exchange + '_' + base + '_' + coin;
    let exists = this.markets.find(function (item) {
      return item.exchange === exchange && item.base === base && item.coin === coin;
    });

    if (!exists) this.markets.push({
      exchange,
      base,
      coin
    });
    this.saveMarkets()
  }

  deleteMarket(exchange: string, base: string, coin: string) {
    let ar = this.markets;
    for (let i = ar.length - 1; i >= 0; i--) {
      let m = ar[i];
      if (m.exchange === exchange && m.base === base && m.coin === coin) ar.splice(i, 1);
    }
    this.saveMarkets();

  }

  saveMarkets() {
    localStorage.setItem('bot-sell-coin', JSON.stringify(this.markets))
  }

}
