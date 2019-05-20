import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import * as cryptojs from 'crypto-js';
import * as crypto from 'crypto';
import {UserLoginService} from '../../services/user-login.service';
import {StorageService} from '../../services/app-storage.service';
import {ApiPrivateAbstaract} from './api-private-abstaract';
import {VOBalance, VOOrder} from '../../../amodels/app-models';
import {map, switchMap} from 'rxjs/operators';

enum RequestType{
  GET = 'GET',
  POST= 'POST',
  DELETE = 'DELETE'
}

export class ApiPrivateCoinbase extends ApiPrivateAbstaract {

  private url ='/api/proxy/https://api-public.sandbox.pro.coinbase.com';
  exchange = 'coinbase';

  constructor(
    private http: HttpClient,
    userLogin: UserLoginService,
    storage: StorageService
  ) {
    super(userLogin, storage);
  }

  downloadBalances(): Observable<VOBalance[]> {
    const path = '/accounts';
    return this.call(path, null, RequestType.GET).pipe(map(res => {
      console.warn(res);
      return res
    }))
  }


  cancelOrder(orderId, base?: string, coin?: string): Observable<VOOrder> {

    return null
  }

  getOrder(orderId, base: string, coin: string): Observable<VOOrder> {

    return null
  }


  async sellLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {
    return  null
  }

  async buyLimit(base: string, coin: string, quantity: number, rate: number): Promise<VOOrder> {

    return  null;
  }


  private call(requestPath: string, data: any, method: RequestType): Observable<any> {
    return this.getApiKey().pipe(switchMap(cred => {

    let url = this.url + requestPath;
    console.log(url);
    const KEY = cred.apiKey;
    const timestamp = '' + Date.now() / 1000;;
    const PASSPHRASE ='vyf0hlcds4j';
    const body = JSON.stringify(data);
    console.log(cred);
   // console.log(atob(cred.password));

    var what = timestamp + method + requestPath + body;
    let SIGN = this.hash_hmac(what, atob(cred.password));

    const headers = new HttpHeaders({
      'CB-ACCESS-KEY': KEY,
      'CB-ACCESS-SIGN':SIGN,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': PASSPHRASE,
     'Content-type':'application/json'
    });

    switch (method) {
      case RequestType.GET:
        return this.http.get(url, {headers});
      case RequestType.POST:
        return this.http.post(url, body, {headers});
      case RequestType.DELETE:
        return this.http.delete(url, {headers});
    }


    }))
  }



  hash_hmac(text, password) {

   /* const getUtf8Bytes = str =>
      new Uint8Array(
        [...unescape(encodeURIComponent(str))].map(c => c.charCodeAt(0))
      );

    const keyBytes = getUtf8Bytes(key);
    const messageBytes = getUtf8Bytes(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' },
      true, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);

// to lowercase hexits
    [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');

// to base64
    btoa(String.fromCharCode(...new Uint8Array(sig)));*/

   // var hmac = crypto.createHmac('sha256', password);
   //  return  hmac.update(text).digest('hex');
    // let dg: any = cryptojs.HmacSHA512(text, password);

    let dg: any = cryptojs.HmacSHA256(text, password);
    return cryptojs.enc.Base64.stringify(dg);
  }


  signedRequest = function (url, data = {}, callback, method = 'GET') {
    /* if ( !options.APIKEY ) throw Error('apiRequest: Invalid API Key');
     if ( !options.APISECRET ) throw Error('signedRequest: Invalid API Secret');
     data.timestamp = new Date().getTime() + info.timeOffset;
     if ( typeof data.recvWindow === 'undefined' ) data.recvWindow = options.recvWindow;*/
    let query = Object.keys(data).reduce(function (a, k) {
      a.push(k + '=' + encodeURIComponent(data[k]));
      return a
    }, []).join('&');

    // let signature = this.h
    //let signature = crypto.createHmac('sha256', options.APISECRET).update(query).digest('hex'); // set the HMAC hash header

    /*  let opt = reqObj(
        url+'?'+query+'&signature='+signature,
        data,
        method,
        options.APIKEY
      );
      proxyRequest(opt, callback);*/
  }
}
