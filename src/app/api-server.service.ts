import { Injectable } from '@angular/core';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {VOBalance} from './models/app-models';

@Injectable()
export class ApiServerService {

  email:string;

  constructor( private http:Http) {

  }

  loadConfig(){
    let url = 'api/app-config';
    return this.http.get(url).map(res=>res.json())

    }

  loadWallets(email:string){
    let url = '/api/wallet/get/' + email;
    return this.http.post(url, {email:email}).map(res=>res.json());

  }

  saveWallets(payload:string, email?:string){
    if(email) this.email = email

    let url = '/api/wallet/save';
    return this.http.post(url, {payload:payload, email:this.email}).map(res=>res.json());
  }

  getBalance(symbol:string, address:string):Observable<any>{

    let url = '/api/coin/balance/{{symbol}}/{{address}}';
    url =  url.replace('{{symbol}}', symbol)
      .replace('{{address}}', address);

    return this.http.get(url).map(res=>{
     // console.log(res);

      return {
        id:'1',
        symbol: symbol,
        address:address,
        balance: res.json().result,
        priceUS:0,
        balanceUS:0,
        isDetails:false
      };
    })
  }

  sendTranasaction(symbol:string, address:string, transaction:string){

    let url = '/api/coin/sendTransaction/{{symbol}}';
    url =  url.replace('{{symbol}}', symbol)
     // .replace('{{address}}', address);

    return this.http.post(url,{rawTransaction:transaction}).map(res=>{
      console.log(res);

      return res;
    })
  }

}


