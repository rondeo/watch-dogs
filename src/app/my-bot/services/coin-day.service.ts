import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import * as moment from 'moment';

@Injectable()
export class CoinDayService {

  format = '';

  constructor(private http: HttpClient) {

  }

  private oneDay(){
    let to = moment().format().slice(0,-6);
    let from = moment().subtract(1, 'day').format().slice(0,-6);
    return '&from='+ from + '&to='+to;
  }
  getCoinDayMarketCap(coin:string){

    return this.http.get('/api/front-desk/market-cap-history?coin='+coin + this.oneDay());
  }

  getCoinDayPoloniex(coin:string){

  }

  getCoinDayBittrex(coin:string){

  }

}
