import { Injectable } from '@angular/core';
import {ShapeShiftService} from '../shape-shift/shape-shift.service';
import {ChangellyService} from './services/changelly.service';
import {PoloniexService} from './services/poloniex.service';
import {CoinEchangeService} from './services/coin-echange.service';
import {BitfinexService} from './services/bitfinex.service';
import {BittrexService} from './services/bittrex.service';
import {CoinbaseService} from './services/coinbase.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {VOSearch} from '../models/app-models';
import {setTimeout} from 'timers';
import {YoBitService} from './services/yo-bit.service';
import {HitBtcService} from './services/hit-btc.service';
import {KrakenService} from './services/kraken.service';

@Injectable()
export class SearchCoinService {

  progress$:Observable<number>;
  progressSub:Subject<number>;
  constructor(
    private shapeshift:ShapeShiftService,
    private changely:ChangellyService,

    private yobit:YoBitService,
    private poloniex:PoloniexService,

    private bittrex:BittrexService,
    private bitFinex:BitfinexService,

    private coinBase:CoinbaseService,
    private coinExchange:CoinEchangeService,

    private hitBTC:HitBtcService,
    private kraken:KrakenService

  ) {
    this.progressSub = new Subject();
    this.progress$ = this.progressSub.asObservable();
  }


  sechCoin(symbol:string):Observable<VOSearch[]>{
    this.progressSub.next(20);
    let subj:Subject<any> = new Subject();
    let results:VOSearch[] =[]

    this.shapeshift.searchCoin(symbol).subscribe(res=>{
      this.progressSub.next(30);
     // console.log(res);
      results = results.concat(res);
      this.changely.searchCoin(symbol).subscribe(res=>{
        this.progressSub.next(40);
        results = results.concat(res);
        this.yobit.searchCoin(symbol).subscribe(res=>{
          this.progressSub.next(50);
          results = results.concat(res);
          this.poloniex.searchCoin(symbol).subscribe(res=>{
            this.progressSub.next(60);
            //this.bittrex.searchCoinMarkets(symbol).subscribe(res=>{

              this.progressSub.next(70);
              //let search:VOSearch[] = res.map(function (item) {

                //return {
                 // exchange:'Bittrex',
                 // pair:item.MarketName.replace('-','_')
                //}
            //  })
              results = results.concat(res);
              this.bitFinex.searchCoin(symbol).subscribe(res=>{
                this.progressSub.next(75);
                results = results.concat(res);
                this.coinBase.searchCoin(symbol).subscribe(res=>{
                  this.progressSub.next(80);
                  results = results.concat(res);
                  this.coinExchange.searchCoin(symbol).subscribe(res=>{
                    this.progressSub.next(85);
                    results = results.concat(res);
                    this.hitBTC.searchCoin(symbol).subscribe(res=>{
                      this.progressSub.next(90);

                      results = results.concat(res);
                      this.kraken.searchCoin(symbol).subscribe(res=>{

                        this.progressSub.next(0);
                        results = results.concat(res);
                        setTimeout(()=>subj.next(results),100);
                      });

                    });

                  });
               // });


              })


            })

          })

        })

      })


    });


    return subj.asObservable();
  }

}
