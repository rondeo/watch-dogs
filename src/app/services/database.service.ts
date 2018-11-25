import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IMarketRecommended} from '../com/utils-order';

@Injectable()
export class DatabaseService {

  constructor(private http: HttpClient) {
  }

  saveMarkets(markets: IMarketRecommended[]) {
    return new Promise((resolve, reject) => {
      this._saveMarket(markets, -1, resolve, reject);
    });
  }

  private _saveMarket(markets: IMarketRecommended[], i, resolve: Function, reject: (err) => void) {
    i++;
    if (i >= markets.length) resolve('OK ' + markets.length);
    else {
      this.saveMarket(markets[i]).then(res => {
        this._saveMarket(markets, i, resolve, reject);
      }).catch(reject);
    }
  }

  saveMarket(market: IMarketRecommended): Promise<any> {
    let url = 'http://localhost:8080/mongodb';
    console.log(url);
    return this.http.post(url, {follow: market}).toPromise();
  }

  saveData(table: string, payload: any): Promise<any> {
    let url = 'http://localhost:8080/mongodb';
    console.log(url);
    return this.http.post(url, {table, payload}).toPromise();
  }

}
