import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AuthHttpService} from '../../services/auth-http.service';

@Injectable()
export class CryptopiaService {

  constructor(
    private http:AuthHttpService
  ) { }


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

  getMarkets():Observable<VOCtopia[]>{

    let url = '/api/cryptopia/markets';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }
}


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