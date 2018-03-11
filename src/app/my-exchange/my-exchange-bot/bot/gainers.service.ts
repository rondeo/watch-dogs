import { Injectable } from '@angular/core';
import {ConnectorApiService} from "../../services/connector-api.service";
import {VOMarket, VOMarketCap} from "../../../models/app-models";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import * as _ from 'lodash';
import {ApiBase} from "../../services/apis/api-base";
import {BehaviorSubject} from "rxjs/BehaviorSubject";


@Injectable()
export class GainersService {

  currentAPI:ApiBase;

  asc_desc='desc';
  sortBy:string = 'rank';
  gainersPercent1h:number = 2;
  allCoins:VOMarketCap[];

  btcMC:VOMarketCap;
  ethMC:VOMarketCap;

  gainersCoinsSub:BehaviorSubject<VOMarketCap[]> = new BehaviorSubject([]);

  gainersCoins$():Observable<VOMarketCap[]>{

    return this.gainersCoinsSub.asObservable();
  }

  constructor(
    private apiService:ConnectorApiService
  ) {
     this.apiService.connector$().subscribe(connector=> {
       this.currentAPI = connector;
      if (!connector) return;

      let sub = connector.getCurrencies().subscribe(res=>{
        if(!res) return;
       // console.log(res);

        let btc = res['BTC'];
        this.btcMC = btc;
        this.ethMC = res['ETH'];

        let coins = Object.values(res);

        coins = this.subtractBTC(coins, btc);

       // console.log(coins);

       // setTimeout(()=>sub.unsubscribe(),50);
        this.allCoins = coins;
        this.sortData(coins);
      })


    });

  }

  subtractBTC(coins:VOMarketCap[], btc:VOMarketCap):VOMarketCap[]{
  return coins.map(function (item: VOMarketCap) {
    let coin = _.clone(item);
      coin.percent_change_1h = +(item.percent_change_1h - this.b.percent_change_1h).toFixed(2);
      coin.percent_change_24h = +(item.percent_change_24h - this.b.percent_change_24h).toFixed(2);
      coin.percent_change_7d = +(item.percent_change_7d - this.b.percent_change_7d).toFixed(2);
      return coin
    }, {b:btc});
  }


  getMC(coin:string):VOMarketCap{
    return this.allCoins.find(function (item) {
      return item.symbol === coin;
    })
  }

  /*getBestMarketForCoin(coin:string):Promise<VOMarket>{

    return new Promise( (resolve, reject) =>{
      let sub = this.currentAPI.getAllMarkets().subscribe(all=>{
       // console.log(all)
        if(!all) return;
        setTimeout(function () { sub.unsubscribe(); }, 100);

        let markets:VOMarket[] = all.filter(function (item) {
         return item.coin === coin;
        });
        let market:VOMarket = markets[0];



      if(markets.length > 1){
        resolve(markets[0]);
          console.log(markets);
      }else resolve(markets[0]);

      });
    })




  }*/


  sortData(allCoins){

    let sorted = allCoins.filter(function (item) {
      return item.percent_change_1h > this.h1;
    }, {h1:this.gainersPercent1h});

    if(sorted.length ===0){
      console.log(' no coins creteria percent_change_1h > ' + this.gainersPercent1h  + ' from '+ allCoins.length);
      return;
    }
    sorted =  _.orderBy(sorted, this.sortBy);
    //console.log(sorted);


    this.gainersCoinsSub.next(sorted);
    // console.log(sorted);

  }

}
