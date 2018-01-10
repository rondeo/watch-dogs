import { Injectable } from '@angular/core';
import {Http} from '@angular/http';
import {ConfigAPI, ConfigApp, VOMarket} from '../models/app-models';
import {CoinSerciceBase} from './coin-sercice-base';
import {MarketCapService} from '../market-cap/market-cap.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {StorageService} from '../services/app-storage.service';
import {setTimeout} from 'timers';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import * as _ from 'lodash';



@Injectable()
export class AllCoinsService {

  configApp:ConfigApp;
  apis:CoinSerciceBase[];
 // apisInd:{[coin:string]:CoinSerciceBase} ;

  currentExchange:CoinSerciceBase;
  currentMarketsArSub:Subject<VOMarket[]>;
  currentMarketsAr$:Observable<VOMarket[]>;

  baseCurrensies:string[];



  allCoins:string[];
  allCoinsSub:BehaviorSubject<string[]>;
  allCoins$:Observable<string[]>;


  selectedMarketsAr:VOMarket[] = [];
  selectedMarketsArSub:BehaviorSubject<VOMarket[]>;
  selectedMarketsAr$:Observable<VOMarket[]>;


  serachResults:VOMarket[];
  serachResults$:Observable<VOMarket[]>;
  serachResultsSub:Subject<VOMarket[]>;




  private apisSub:BehaviorSubject<CoinSerciceBase[]>;
  apis$:Observable<CoinSerciceBase[]>;



  constructor(
    private http:Http,
    private marketCap:MarketCapService,
    private storage:StorageService
  ) {

    this.currentMarketsArSub = new Subject();
    this.currentMarketsAr$ = this.currentMarketsArSub.asObservable();

    this.allCoinsSub = new BehaviorSubject(null);
    this.allCoins$ = this.allCoinsSub.asObservable();



    this.apisSub = new BehaviorSubject(null);
    this.apis$ = this.apisSub.asObservable();


    this.serachResultsSub = new Subject();
    this.serachResults$ = this.serachResultsSub.asObservable();


    this.selectedMarketsArSub = new BehaviorSubject(null);
    this.selectedMarketsAr$ = this.selectedMarketsArSub.asObservable();


    marketCap.coinsAr$.subscribe(res=>{

      if(!res) return;

      let allCoins = marketCap.getAllCoinsData();

      let cfg = new ConfigApp();
      let apis = cfg.exchangesPublic.filter(function (item) {
        return item.enabled;
      });

      this.apis = apis.map(function (item: ConfigAPI) {
        return new CoinSerciceBase(item, allCoins, http, storage);
      })


      this.apis.forEach((item)=>{

        item.marketsAr$.subscribe(res=>{
          if(!res)return;
          this.selectedMarketsAr = this.selectedMarketsAr.concat(res);
          this.selectedMarketsArSub.next(this.selectedMarketsAr);
        })


        item.serachResults$.subscribe(res=>{
          if(!res) return
          this.serachResults =  this.serachResults.concat(res);
          this.serachResultsSub.next(this.serachResults);
        })
      })

      this.apisSub.next(this.apis);


      //this.filterCoins();
    });

    this.marketCap.refresh();
  }

  activeExchanges:any;

  loadCoinsSelectedExchanges():void{
    if(!this.apis){
      setTimeout(()=>this.loadCoinsSelectedExchanges(), 1000);
      return;
    }
    let self = this;
    let out:string[] = [];
    let activeExchanges = this.getActiveExchanges();
    let i =0;

    this.selectedMarketsAr = [];
    this.apis.forEach(function (service) {
      if(activeExchanges[service.config.uid]){
        i++
        service.dispatchMarketsAr();

        /*service.getAllMarketsAr().subscribe(coins=>{
          if(!coins) return;
          i--
          out = _.uniq(out.concat(coins)).sort();
          if(i==0){
            self.allCoins = out;
            self.allCoinsSub.next(out);
          }

        });*/
      }

    });
  }


  seachCoin(symbol:string):void{
    let result = [];
    this.serachResults = [];
    let activeExchanges = this.activeExchanges;
    if(!this.apis){
      setTimeout(()=>this.seachCoin(symbol), 500);
      return;
    }

      console.log(' apis raedy search  '+  symbol);

    this.apis.forEach(function (service) {

        if(activeExchanges[service.config.uid]){
          service.searchCoin(symbol, false);
        }

    })

  }

  private sub1:Subscription;

  setCurrentExchangeById(uid:string){
   /// console.log(uid);

    if(!this.apis){
      setTimeout(()=>this.setCurrentExchangeById(uid),1000);
      return
    }

   if(this.sub1) this.sub1.unsubscribe();

     this.currentExchange = this.apis.find(function (item) {
      return item.config.uid === uid;
    });

    this.sub1 = this.currentExchange.getAllMarketsAr().subscribe(dataAr=>{

      if(!dataAr) return;
     // console.log(dataAr);
      this.baseCurrensies = this.currentExchange.baseCurrenciesAr;
    //  console.log(dataAr);


      this.currentMarketsArSub.next(dataAr);
    })

    //let echageData = this.currentExchange.marketsAr$;

    //this.currentExchangeSub.next(this.currentExchange);

  }

  isComplex():boolean{
    return this.currentExchange.config.isMarketComplex;
  }

  loadDetails(markets:VOMarket[]){
    this.currentExchange.loadMarketsDetailsAr(markets);
  }

  getExchangeById(id:string){
    this.apis$.subscribe(res=>{
      if(!res) return;

    })

  }

  getAllExchanges():Observable<CoinSerciceBase[]>{

    return this.apis$;
  }


  setActiveExchanges(exchanges: {[uid:string]:boolean}) {
    this.activeExchanges = exchanges;
    this.storage.setItem('exchanges', JSON.stringify(this.activeExchanges));

  }


  getActiveExchanges() {
    if(!this.activeExchanges) {
      let str = this.storage.getItem('exchanges');

      if (str) this.activeExchanges = JSON.parse(str);
      else this.activeExchanges = {
        bittrex: true,
        poloniex: true,
        novaexchange: false,
        cryptopia: true,
        hitbtc: false,
      };
    }
    return this.activeExchanges;
    }

  getMarketUrl(market: VOMarket):string {
   let service:CoinSerciceBase =  this.apis.find(function (item) {
      return item.config.uid === market.exchange
    });
   return service.getMarketUrl(market);
  }
}
