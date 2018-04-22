import {VOOrder} from "../../models/app-models";
import {Observable} from "rxjs/Observable";
import {ApiPrivateAbstaract} from "./api-private-abstaract";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import * as cryptojs from 'crypto-js';
import * as _ from 'lodash';
import {HttpClient} from "@angular/common/http";
import {StorageService} from "../../services/app-storage.service";

export class ApiPrivateBittrex extends ApiPrivateAbstaract{
  //apiKey:string;
 // password:string;
  constructor(
    private http:HttpClient,
    storage:StorageService
  ){
    super(storage);
  }

  buyLimit(base: string, coin:string,  quantity: number, rate: number): Observable<VOOrder> {
    let market = base+'-'+coin;
    console.log(' buy market ' + market + '  quantity: ' + quantity + ' rate:' + rate);
    let uri = 'https://bittrex.com/api/v1.1/market/buylimit';
    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    }).map(res=>{
      console.log(' buyLimit market ' + market , res);

      return res.result;
    });
  }

  /*{"orderNumber":31226040,"resultingTrades":[{"amount":"338.8732","date":"2014-10-18 23:03:21","rate":"0.00000173","total":"0.00058625","tradeID":"16164","type":"buy"}]}*/

  sellLimit(base: string, coin:string, quantity: number, rate: number): Observable<VOOrder> {

    let market = base+'-'+coin;
    console.log(' sell market ' + market + '  quantity: ' + quantity + ' rate:' + rate);

    let uri = 'https://bittrex.com/api/v1.1/market/selllimit';
    return this.call(uri, {
      market: market,
      quantity: quantity,
      rate: rate
    }).map(res=>{
      console.log(' sellLimit market '+market , res);
      if(res.success) return res.result;
      else return {
        uuid:'',
        message:res.message
      }
    });
  }

  private call(uri: string, post: any): Observable<any> {
    return this.getCredentials().switchMap(cred=>{
      if(!cred) throw new Error('login reqired');
      post.apikey = cred.apiKey;
      post.nonce = Math.ceil(Date.now() / 1000);
      let load = Object.keys(post).map(function (item) {
        return item + '=' + this.post[item];
      }, {post: post}).join('&');

      uri += '?' + load;
      console.log(uri);
      let signed = this.hash_hmac(uri, cred.password);
      let url = '/api/bittrex/private';
      return this.http.post(url, {uri: uri, signed: signed});
    });

  }

  hash_hmac(text, password) {
    let dg: any = cryptojs.HmacSHA512(text, password);
    return dg.toString(cryptojs.enc.Hex);
  }

}
