import { Injectable } from '@angular/core';
import * as moment from 'moment';
import {Observable} from 'rxjs/Observable';
import {Http} from '@angular/http';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class CompareService {

  coinsList:{[symbol:string]:SOCoinCompare};

  constructor(
    private http:Http
  ) {
   /* this.getCoinsList().subscribe(res=>{
      console.log(res)
      this.coinsList = res.Data

    });*/
  }


  getCoinsList(){
    let url = '/api/compare/coinslist';
    return this.http.get(url).map(res=>{
     let r =  res.json();
      this.coinsList = r.Data;

    })

  }

  getMarketsOfCoin(symbol:string){
    if(!this.coinsList) {

      return this.getCoinsList().switchMap(res=>{

        let coin:SOCoinCompare = this.coinsList[symbol];

        let url = '/api/compare/snapshotfullbyid/'+coin.Id;
        return this.http.get(url).map(res=>{
          return res.json();
        })
      });

    }else{

      let coin:SOCoinCompare = this.coinsList[symbol];
      let url = '/api/compare/snapshotfullbyid/'+coin.Id;
      return this.http.get(url).map(res=>{
        let r =  res.json();

        return r
      })
    }


   // console.log(this.coinsList);
    //let coin:SOCoinCompare = this.coinsList[symbol];
    //if(!coin) return (new BehaviorSubject(null)).asObservable();



  }

  getHistoryHours(base:string, coin:string, time:number, limit =100, aggregate = 1, exchange:string = 'CCCAGG'):Observable<SOResultHour>{
    let q = {
      tsym:base,
      fsym:coin,
      e:exchange,
      limit:limit,
      toTs:time+'',
      aggregate:aggregate+''
    };

    let url = 'https://min-api.cryptocompare.com/data/histohour'+toQuery(q);

    return this.http.get(url).map(res=>{
      let r = res.json();
      r.Data.forEach(function (item) {
        item.date = moment.unix(item.time).toISOString();//.format(' HH  MM/YY');
      })

      return r
    })
  }

  getHistoryDays(base:string, coin:string, time:number, limit =100, aggregate = 1, exchange:string = 'CCCAGG'):Observable<SOResultHour>{
    let q = {
      tsym:base,
      fsym:coin,
      e:exchange,
      limit:limit,
      toTs:time+'',
      aggregate:aggregate+''
    };



    let url = ' https://min-api.cryptocompare.com/data/histoday'+toQuery(q);

    return this.http.get(url).map(res=>{
      let r = res.json();

      r.Data.forEach(function (item) {
        item.date = moment.unix(item.time).toISOString();//.format(' HH  MM/YY');
      })

      return r
    })
  }



}


export interface SOResultHour{
  Data:SOHour[];
}

export interface SOHour{
  close:number
  date:string;
  high:number;
  low:number;
  open:number;
  time:number;
  volumefrom:number;
  volumeto:number;
}


export interface SOCoinCompare{
  Algorithm:string;
  CoinName:string;
  FullName:string;
  FullyPremined:number
  Id:number
  ImageUrl:string;
  Name:string;
  PreMinedValue:string;
  ProofType:string;
  SortOrder:number;
  Sponsored:boolean;
  Symbol:string;
  TotalCoinSupply:number;
  TotalCoinsFreeFloat:number;
  Url:string;// "/coins/1cr/overview"

}

export function toQuery(obj:any):string{
  let out = [];
  for(let str in obj)if(obj[str])out.push(str+'='+obj[str]);
  return out.length?'?'+out.join('&'):'';
}

