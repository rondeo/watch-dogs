import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';
import {VOMarketCap, VOMarketCapExt} from '../../amodels/app-models';
import {ApiMarketCapService} from './api-market-cap.service';
import {Parsers} from './parsers';


@Injectable()
export class MongoService {

  constructor(private http: HttpClient) {
  }


 private  geteData( find: any, fields: any, start: number,  limit: number): Promise<any> {

    const url = '/api/mongo/transactions/btc?q=' + JSON.stringify(find) + '&fields='
      + JSON.stringify(fields) + '&start=' + start + '&limit=' + limit;
    console.log(url);
    return this.http.get(url).toPromise();
  }


  downloadBTCLarge(to: string, from: string, start: number = 0, limit: number = 100)
    : Promise<{[symbol: string]: {btc: number, usd: number}}[]> {
    const find = {
      timestamp: {$gt: moment(from).valueOf(), $lt: moment(to).valueOf()}
    };

    const fields: any = {};
    return this.geteData(find, fields, start, limit).then((res: any) => {
       console.log(res);
      return res.data.map(function (item) {

          return item;
      });
    });
  }

  downloadCoinHistory(to: string, from: string, coin: string, limit: number): Promise<any[]> {
    console.log(to, from);
    const find = {
      timestamp: {$gt: moment(from).valueOf(), $lt: moment(to).valueOf()}
    };
    const fields: any = {};
    fields[coin] = 1;
    fields.date = 1;

    return this.geteData('last', find, fields, limit).then((res: any) => {
      console.log(res);
      return res.payload.map(function (itemObj) {
        const item = itemObj[coin];
        return item ? Parsers.mapAgrigated(item, coin) : null;
      });
    });
  }


}
