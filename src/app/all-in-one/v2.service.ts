import { Injectable } from '@angular/core';
import {Http} from '@angular/http';
import {V2BaseSercice} from './v2-base';
import {MarketCapService} from '../market-cap/market-cap.service';
import {StorageService} from '../services/app-storage.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {VOMarket} from '../models/app-models';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import * as _ from 'lodash';
import {HttpClient} from "@angular/common/http";

@Injectable()
export class V2Service {

  exchanges:V2BaseSercice[];


  private exchangesSub:BehaviorSubject<V2BaseSercice[]>
  exchanges$:Observable<V2BaseSercice[]>;



  searchWord:string;
  searchTopic:string;


  private serachResultAr:VOMarket[];
  private serchResultSub:Subject<VOMarket[]>;

  serchResult$:Observable<VOMarket[]>;

    isActive:boolean;

    ascDesc:string;
    sortBy:string;

  constructor(
    private http:HttpClient,
    private marketCap:MarketCapService,
    private storage:StorageService
  ) {

    this.exchangesSub = new BehaviorSubject(null);
    this.exchanges$ = this.exchangesSub.asObservable();

    this.serchResultSub = new Subject();
    this.serchResult$ = this.serchResultSub.asObservable();
  }


  private sort(){
    let ar = this.serachResultAr;
    if(!Array.isArray(ar)) return;

   ar =  _.orderBy(ar, this.sortBy, this.ascDesc);

   this.serchResultSub.next(ar);
  }

  sortResultBy(prop:string){
    if(this.sortBy === prop) this.toggleOrder();
      this.sortBy = prop;
      this.sort();
  }

  toggleOrder(){
    this.ascDesc = this.ascDesc ==='desc'?'asc':'desc';
  }


  stop(){
    this.isActive = false;
  }


  isExchangesLoaded:boolean;

  loadExchangesData() {
    if(this.isExchangesLoaded) return;
    this.isExchangesLoaded = true;

    this.http.get('/api/all-in-one').subscribe((res:any) => {
      let http = this.http;
      let storage = this.storage;
      let configs = res.data;
      let mcSub;

      mcSub = this.marketCap.coinsAr$.subscribe(ar => {
        if (!ar) {
          this.marketCap.refresh();
          return;
        }

        let mc = this.marketCap.getAllCoinsData();

        if (mcSub) mcSub.unsubscribe();

       let exchanges =  configs.map((item) => {
          return new V2BaseSercice(item, mc, http, storage);
        });

        this.exchanges = exchanges;
        this.exchangesSub.next(exchanges);

      })
    })
  }


  isMarketsLoaded = false;
  loadExchangesMarkets(callBack?:Function){
    if(this.isExchangesLoaded) return;
    this.isMarketsLoaded = true;


    this.exchanges$.subscribe(exchanges=>{

      if(!exchanges) return;

      let timeout;
      let counter =  exchanges.length;

      exchanges.forEach((service) =>{

        service.marketsAr$.subscribe(res=>{
          if(!res) return;

          counter--;
          // console.log('loaded ' +service.config.uid +' ' +counter);

          clearTimeout(timeout);
          timeout = setTimeout(()=>{
            console.log('DONE by timeout counter: '+counter);
            if(callBack)callBack(counter);

          }, 4000);

          if(counter<=0){
            clearTimeout(timeout)
            if(callBack)callBack(counter--);
            console.log('DONE OK');
          }

        },error=>{
          counter--;
          console.log('%c Error ' +service.config.uid  + '   '+counter +'  status: '+ error.status +' '+error.url, 'color:red');
          if(counter<=0){
            clearTimeout(timeout);

            if(callBack) callBack(counter--);
            console.log('DONE with Error ');
          }
        });
        service.loadMarkets();
      });
    })
    this.loadExchangesData();
/*
    this.http.get('/api/all-in-one').map(res=>res.json()).subscribe(res=>{
      let http = this.http;
      let storage = this.storage;
      let exchanges = res.data;
      let mcSub;

    mcSub =   this.marketCap.coinsAr$.subscribe(ar=>{
        if(!ar) {
          this.marketCap.refresh();
          return;
        }

        if(mcSub)mcSub.unsubscribe();

        let mc = this.marketCap.getAllCoinsData();

        let services:V2BaseSercice[] = [];

        let timeout;




        let counter =  exchanges.length;
        exchanges.forEach((item) =>{
          let service = new V2BaseSercice(item, mc, http, storage);

          service.marketsAr$.subscribe(res=>{
            if(!res) return;

            counter--;
           // console.log('loaded ' +service.config.uid +' ' +counter);

            clearTimeout(timeout);
            timeout = setTimeout(()=>{
                console.log('DONE by timeout counter: '+counter);
              callBack(counter);

            }, 4000);

            if(counter<=0){
              clearTimeout(timeout)
              callBack(counter--);
              console.log('DONE OK');
            }

          },error=>{
            counter--;
            console.log('%c Error ' +service.config.uid  + '   '+counter +'  status: '+ error.status +' '+error.url, 'color:red');
            if(counter<=0){
              clearTimeout(timeout);

              callBack(counter--);
              console.log('DONE with Error ');
            }
          });
          service.loadMarkets();
          services.push(service);

        });

        this.exchanges = services;
        this.exchangesSub.next(services);

      });

    })*/

  }

  searchSymbol(seachSymbol: string) {
    this.searchWord = seachSymbol;
    this.searchTopic = 'symbol';
    let results:VOMarket[] = [];
    let timeout;
    this.exchanges$.subscribe(exchanges=>{
      if(!exchanges) return;
     // console.log(exchanges);
      exchanges.forEach( (item) =>{
       // if(!item.isError){
          item.searchCoin(seachSymbol).subscribe(ar=>{
            if(ar && ar.length){
              results = results.concat(ar);

              clearTimeout(timeout);
              timeout = setTimeout(()=>{
                console.log('Triggered by searchSymbol');
                this.serachResultAr = results;
                this.serchResultSub.next(results)
              },200);

            }
          });
       // }else console.log(' error in '+ item.config.uid);
        // else console.log(item.config.uid +' no markets for '+ seachSymbol);

      });
    });

    this.loadExchangesMarkets(null);
   // if(!this.exchanges) this.initAllInOne(()=>{});


    //this.serchResultSub.next(results);
  }

  searchMarketsByExchange(exchange: string) {
    this.searchWord = exchange;
    this.searchTopic = 'exchange';
    this.loadExchangesData();
    console.log('searchMarketsByExchange '+ exchange);
   // if(!this.exchanges) {
      this.exchanges$.subscribe(exchanges=>{

        if(!exchanges) return;

        console.log(exchanges);

        let service:V2BaseSercice = exchanges.find(function (item) {
          return  item.config.uid === exchange
        });

        let sub = service.marketsAr$.subscribe(markets=>{

          console.log('serach result triggered by searchMarketsByExchange');
          this.serachResultAr = markets;
          this.serchResultSub.next(markets);
        });

        service.loadMarkets(true);
       // console.log(service);


      })

     // this.initAllInOne(()=> this.searchMarketsByExchange(exchange));
//
    //  return;
    //}





   // let markets = service.marketsAr;


   // this.serchResultSub.next(markets);

  }

  getMarketUrl(market: VOMarket):string {
    let exchange = _.find(this.exchanges, {uid:market.exchange});
    console.log(exchange);
    return exchange?exchange.config.urlMarket:null;
  }
}
