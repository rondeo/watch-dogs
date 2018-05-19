import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";

export interface VOCruptoCompare {
  Id: string;
  Url: string;
  ImageUrl: string;
  "Name": string,
  Symbol: string,
  CoinName: string;
  FullName: string;
  Algorithm: string;
  ProofType: string;
  FullyPremined: string
  TotalCoinSupply: number,
  PreMinedValue: string;
  TotalCoinsFreeFloat: string;
  SortOrder: number;
  Sponsored: boolean;
}

@Injectable()
export class ApiCryptoCompareService {

  private coinList: { [symbol: string]: VOCruptoCompare }

  constructor(private http: HttpClient) {

  }

  getSocialStats(symbol: string) {
    return this.getCoinLists().switchMap(coins =>{
      console.log( coins[symbol]);
      const url = 'api/proxy-cache-5min/www.cryptocompare.com/api/data/socialstats/?id=' + coins[symbol].Id;
      console.log(url);
      return this.http.get(url).map(res => {
        console.log(res);
        return res
      })
    })
  }



  getCoinLists() {
    const url = 'api/proxy-cache-5min/www.cryptocompare.com/api/data/coinlist';
    if(this.coinList) return Observable.of(this.coinList);
    else return(<any> this.http.get(url)).map(res =>{
      this.coinList=res.Data;
      return  this.coinList
    })

  }

}
