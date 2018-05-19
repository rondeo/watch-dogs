import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import * as moment from "moment";
import {VOMarketCap, VOMarketCapExt} from "../models/app-models";
import {ApiMarketCapService} from "./api-market-cap.service";
import {Parsers} from './parsers';
import {VOMCAgregated} from './models';


@Injectable()
export class MongoService {

  constructor(private http: HttpClient) {
  }

  saveData(table: string, payload: any): Promise<any> {
    let url = 'http://localhost:8080/mongodb';
    console.log(url);
    return this.http.post(url, {table, payload}).toPromise();
  }


  geteData(table: string, find: any, fields: any, limit: number): Promise<any> {

    let url = 'http://localhost:8080/mongodb?table=' + table + '&find=' + JSON.stringify(find) + '&fields=' + JSON.stringify(fields) + '&limit=' + limit;
    console.log(url);
    return this.http.get(url).toPromise();
  }

  downloadCoinsBTCandUSD(to: string, from: string, coins: string[], limit: number): Promise<{[symbol:string]:{btc:number, usd:number}}[]> {
    const find = {
      timestamp: {$gt: moment(from).valueOf(), $lt: moment(to).valueOf()}
    }

    const fields: any = {};
    coins.forEach(function (item) {
      fields[item+'.usd'] = 1;
      fields[item+'.btc'] = 1;
    });

    fields.date = 1;
    return this.geteData('last', find, fields, limit).then((res: any) => {
     //  console.log(res);
      return res.payload.map(function (itemObj) {

        const out = {
          date:itemObj.date
        };

        coins.forEach(function (coin) {
          const item = itemObj[coin];
          out[coin] =  {
            btc: item.btc,
            usd:item.usd
          }
        });
        return out;
      })
    });
  }

  downloadCoinHistory(to: string, from: string, coin: string, limit: number): Promise<VOMCAgregated[]> {
    console.log(to, from);
    const find = {
      timestamp: {$gt: moment(from).valueOf(), $lt: moment(to).valueOf()}
    }
    const fields: any = {};
    fields[coin] = 1;
    fields.date = 1;

    return this.geteData('last', find, fields, limit).then((res: any) => {
      console.log(res);
      return res.payload.map(function (itemObj) {
        const item = itemObj[coin];
        return item?Parsers.mapAgrigated(item, coin):null;
      });
    })
  }


}
