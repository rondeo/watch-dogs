import {Injectable} from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import * as _ from 'lodash';
import {VOSearch} from '../../models/app-models';

@Injectable()
export class CoinEchangeService {

  market: any[];
  market$: Observable<any>;
  marketSub: Subject<any>

  constructor(private http: AuthHttpService) {
    this.marketSub = new Subject();
    this.market$ = this.marketSub.asObservable();
  }



  private _searchCoin(symbol:string, ar:VOCECoin[]):VOSearch[]{
    return ar.filter(function (item) {
      return item.symbol.indexOf(symbol) !== -1;
    }).map(function (item) {
      return {
        exchange:'CoinExchange',
        symbol:item.symbol
      }
    })
  }

  searchCoin(symbol:string):Observable<VOSearch[]>{
    let sub:Subject<VOSearch[]> = new Subject();

    this.getMarket().subscribe(res=>{
      //  console.log(res);
      sub.next(this._searchCoin(symbol, res));
    })

    return sub.asObservable()
  }




  getMarket():Observable<VOCECoin[]> {

    let url = '/api/coinexchange/market-names';

    return this.http.get(url).switchMap(res1 => {
      return this.http.get('/api/coinexchange/market-details').map(res2 => {

        let r1: Result1[] = res1.json().result;
        let indexed: { [index: number]: Result1 } = _.keyBy(r1, 'MarketID');

        let r2: Result2[] = res2.json().result;


        let out = r2.map(function (item) {

          let coin: Result1 = indexed[item.MarketID];

          return {
            symbol: coin.MarketAssetCode,
            label: coin.MarketAssetName,
            network: coin.BaseCurrencyCode,
            id: +item.MarketID,
            last: +item.LastPrice,
            high: +item.HighPrice,
            low: +item.LowPrice,
            ask: +item.AskPrice,
            bid: +item.BidPrice,
            buyers: +item.BuyOrderCount,
            sellers: +item.SellOrderCount,
            trades: +item.TradeCount,
            volume: +item.Volume,
            btc: +item.BTCVolume,
            change: +item.Change
          }
        })
       // console.log(r1, r2);
        return out;
      })
    });
  }


}

export interface VOCECoin {
  symbol: string;
  label: string;
  network: string;
  id: number;
  last: number;
  high: number
  low: number;
  ask: number;
  bid: number;
  buyers: number;
  sellers: number;
  trades: number;
  volume: number;
  btc: number;
  change: number;

}

interface Result1 {
  MarketID: number;
  MarketAssetName: string;
  MarketAssetCode: string;
  MarketAssetID: number;
  MarketAssetType: string;
  BaseCurrency: string;
  BaseCurrencyCode: string;
  BaseCurrencyID: number;
  Active: boolean;
}

interface Result2 {
  MarketID: number;
  LastPrice: number;
  Change: number;
  HighPrice: number;
  LowPrice: number;
  Volume: number;
  BTCVolume: number;
  TradeCount: number;
  BidPrice: number;
  AskPrice: number;
  BuyOrderCount: number;
  SellOrderCount: number;
}