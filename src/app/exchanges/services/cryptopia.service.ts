import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';
import {APIBooksService} from "../../services/books-service";
import {VOMarket, VOOrderBook} from "../../models/app-models";
import {StorageService} from "../../services/app-storage.service";

import {ApiLogin} from "../../shared/api-login";
import {IExchangeConnector} from "../../my-exchange/services/connector-api.service";
import {Mappers} from "../../com/mappers";
import {SelectedSaved} from "../../com/selected-saved";

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {applyMixins} from "rxjs/util/applyMixins";



export class CryptopiaService extends ApiLogin implements IExchangeConnector, SelectedSaved{


  constructor(
    private http:AuthHttpService,
    storage:StorageService
  ) {
    super(storage, 'cryptopia');

  }
  private booksObs:Observable<any>;
  getOrderBook(base:string, coin: string, depthMax = '50') {

    let url = 'api/cryptopia/getorderbook/' +base +'-' +coin + '/' + depthMax;
    if(!!this.booksObs) return this.booksObs;
    console.log(url);
    this.booksObs =  this.http.get(url).map(res => {
      let r = (<any>res).result;
      console.log('books ', r);
      this.booksObs = null
      return r;// MappersBooks.bittrex(r, price);

    });
    return this.booksObs;

  }

  getCurrencies():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/currencies';
    return this.http.get(url).map(res=>{
      let obj = res.json();
     // console.log(obj);
      //let out:VOCryptopia[]=[];
      return obj.Data.map(function (item) {
        return item;

      });

    })
  }

  getPairs():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/pairs';
    return this.http.get(url).map(res=>{
      let obj = res.json();
     // let out:VOCryptopia[]=[];
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }

  marketsArSub:BehaviorSubject<VOMarket[]> = new BehaviorSubject<VOMarket[]>(null);
  isLoadinMarkets:boolean = false;

  loadAllMarketSummaries():void {
    console.log('%c cruptopia  loadAllMarketSummaries   ','color:orange');
    if(this.isLoadinMarkets) return;
    this.isLoadinMarkets = true;

    let url = '/api/cryptopia/markets';
      // let url = 'https://bittrex.com/api/v1.1/public/getmarketsummaries';

      //let marketCap = this.marketCap.getAllCoinsData();

      this.http.get(url).subscribe(result=>{

        console.log(result);
        let marketsAr:VOMarket[] = [];
       // let indexed:{[pair:string]:VOMarket} ={};
        let baseCoins:string[] = [];
        //let localCoins:{[symbol:string]:VOMarketCap} = {};
        //let coinsAvailable:string[]=[];



       // let selected:string[] = this.getMarketsSelected();

       // Mappers.bittrexMarkets( result, marketsAr, indexed, baseCoins, MC, selected, localCoins);

        //this.marketsAr = marketsAr;
       // this.markets = indexed;
       //this.baseCoins = baseCoins;
        //this.coinsSub.next(localCoins);

        this.marketsArSub.next(marketsAr);
        this.isLoadinMarkets = false;
      })


  }

  getMarkets():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/markets';
    return this.http.get(url).map(res=>{
      let obj = res;
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }

  marketsSelected:string[]
  saveMarketsSelected:()=>void;
  getMarketsSelected:()=>string[];

}

applyMixins (CryptopiaService, [SelectedSaved]);

export interface VOCtopia{
  Id:number;
  Name:string;
  Symbol:string;
  Algorithm:string;
  WithdrawFee:number;
  MinWithdraw:number;
  MinBaseTrade:number;
  IsTipEnabled:boolean;
  MinTip:number;
  DepositConfirmations:number;
  Status:string;
  StatusMessage:string;
  ListingStatus:string;
}

export interface VOCtopiaPair{

}