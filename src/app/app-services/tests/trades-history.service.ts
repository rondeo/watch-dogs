import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';
import * as _ from 'lodash';
import {map} from 'rxjs/operators';


@Injectable()
export class TradesHistoryService {

  constructor(
    private http: HttpClient
  ) {

    let from = '2018-09-28T10:00:00';
    const m = moment(from);
    m.subtract(2, 'hours');
    this.getTrades(m.toISOString(true), m.add(60, 'minutes').toISOString(true)).subscribe(res => {

      console.log(res);

      const first = res[0][0];
      const last = _.last( _.last(res));
      from = moment(first.timestamp).format('DD HH:mm');
      const to = moment(last.timestamp).format('DD HH:mm');

      let large = [];
      res.forEach(function (row) {
        const t1 = row[0].timestamp;
        const t2 = row[row.length - 1].timestamp;
        const dif = (t1 - t2) / 60000;
        if (dif < 1) console.log(moment(t2).format('HH:mm'));
        const fs = row.filter(function (item) {
          item.dif = dif;
          return item.amountCoin > 10;
        });

       large = large.concat(fs);
      });

      large.forEach(function (item) {
        item.time = moment(item.timestamp).format('HH:mm');
      });
      console.log(from, to);
      console.log(first.rate, last.rate);
      console.log(large);
    });
  }

  parseBitfinex(ar: any[]) {
    if (!ar) return[];
    return ar.map(function (o) {
      return {
        uuid: o[0],
        dif: 0,
        exchange: 'bitfinex',
        action: o[2] < 0 ? 'SELL' : 'BUY',
        timestamp: o[1],
        amountCoin: Math.abs(o[2]),
        rate: o[3]
      };
    });
  }
  getTrades(from: string, to: string, exchange= 'bitfinex') {
    // from = moment(from).su

    const table =  exchange === 'bitfinex' ? 'trades' : 'binance_trades';
    const params = {
      from,
      to,
      table
    };
    const url = '/api/proxy/http://uplight.ca/cmc/get-trades.php';
    return this.http.get(url, {params: params}).pipe(map((res: any[]) => {
      console.log(res);
      const out = [];
      return res.map( (item: any[]) => {
        const row = this.parseBitfinex(item);
        return row;
      });

    }));
  }

}
