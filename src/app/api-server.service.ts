import { Injectable } from '@angular/core';

import {VOBalance} from './models/app-models';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';

@Injectable()
export class ApiServerService {

  email:string;

  constructor( private http:HttpClient) {

  }

  loadConfig(){
    let url = 'api/app-config';
    return this.http.get(url).pipe(map(res=>res));



    }

  loadWallets(email:string){
    let url = '/api/wallet/get/' + email;
    return this.http.post(url, {email:email}).pipe(map(res=>res));

  }

  saveWallets(payload:string, email?:string){
    if(email) this.email = email

    let url = '/api/wallet/save';
    return this.http.post(url, {payload:payload, email:this.email}).pipe(map(res=>res));
  }

  getBalance(symbol:string, address:string):Observable<any>{

    let url = '/api/coin/balance/{{symbol}}/{{address}}';
    url =  url.replace('{{symbol}}', symbol)
      .replace('{{address}}', address);

    return this.http.get(url).pipe(map(res=>{
     // console.log(res);

      return {
        id:'1',
        symbol: symbol,
        address:address,
        balance: res,
        priceUS:0,
        balanceUS:0,
        isDetails:false
      };
    }));
  }

  sendTranasaction(symbol:string, address:string, transaction:string){

    let url = '/api/coin/sendTransaction/{{symbol}}';
    url =  url.replace('{{symbol}}', symbol)
     // .replace('{{address}}', address);

    return this.http.post(url,{rawTransaction:transaction}).pipe(map(res=>{
      console.log(res);

      return res;
    }));
  }

}


