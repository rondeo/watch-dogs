import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class ApiBitcoinAverageService {

  constructor(
    private http: HttpClient
  ) { }

  getExchanges(){
    const url ='api/proxy-cache-5min/apiv2.bitcoinaverage.com/weighting/exchanges';
    return this.http.get(url);

  }

}
