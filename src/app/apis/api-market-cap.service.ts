import {Injectable} from '@angular/core';
import {MarketCapService} from "../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class ApiMarketCapService {

  constructor(private http: HttpClient) {
  }

  downloadAllCoins() {
    let url = '/api/marketcap/ticker';
    console.log('%c ' + url, 'color:pink');
    return this.http.get(url).map((res: any) => {
      let MC = MarketCapService.mapServerValues(Object.values(res))
      return MC;
    });


  }


}
