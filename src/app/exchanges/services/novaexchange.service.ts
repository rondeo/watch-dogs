import { Injectable } from '@angular/core';
import {AuthHttpService} from '../../services/auth-http.service';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class NovaexchangeService {

  constructor(
    private http:AuthHttpService
  ) { }


  getCurrencies():Observable<VONovo[]>{
    let url = 'api/novaexchange/markets';
    return this.http.get(url).map(res=>{
      let obj = res.json();
      let out:VONovo[]=[];
      return obj.markets.map(function (item) {
        return item;

      });

    })
  }

}

export class VONovo{
  ask:number;
  basecurrency:string;
  bid:number
  change24h:number;
  currency:string;
  disabled:number;
  high24h:number;
  last_price:number;
  low24h:number;
  marketid:number;
  marketname:string;
  volume24h:number;
}
