import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import * as moment from "moment";
import {VOMarketCap, VOMarketCapExt} from "../models/app-models";
import {ApiMarketCapService, VOMCAgregated} from "./api-market-cap.service";


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

  downloadCoinsHistory(to: string, from: string, coins: string[], limit: number): Promise<VOMCAgregated[]> {
    const find = {
      timestamp: {$gt: moment(from).valueOf(), $lt: moment(to).valueOf()}
    }

    console.log(coins)
    const fields: any = {};
    coins.forEach(function (item) {
      fields[item] = 1;
    });
    fields.date = 1;

    console.warn(fields);
    return this.geteData('last', find, fields, limit).then((res: any) => {
      return res.payload.map(function (itemObj) {
        const out = {};
        coins.forEach(function (coin) {
          const item = itemObj[coin];
          out[coin] = ApiMarketCapService.mapAgrigated(item, coin);
        });
        return out;
      })

    });
  }

  downloadCoinHistory(to: string, from: string, coin: string, limit: number): Promise<VOMCAgregated[]> {
    const find = {
      timestamp: {$gt: moment(from).valueOf(), $lt: moment(to).valueOf()}
    }
    const fields: any = {};
    fields[coin] = 1;
    fields.date = 1;

    return this.geteData('last', find, fields, limit).then((res: any) => {
      return res.payload.map(function (itemObj) {
        const item = itemObj[coin];
        return ApiMarketCapService.mapAgrigated(item, coin);
      });
    })
  }


}
