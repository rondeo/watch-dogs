import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs/Observable";
import {VOMarketCap} from "../../models/app-models";

@Injectable()
export class FrontDeskService {

  constructor(private http: HttpClient) {
  }

  getMarketCapHistory(coin: string, limit: number): Observable<VOMarketCap[]> {
    // from=2018-03-18T10:00:00&to=2018-03-18T10:00:0
    let url = 'api/front-desk/market-cap-history?coin=' + coin + '&limit=' + limit;
    return this.http.get(url).map((res: any) => {
      return res.data.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          symbol: item.symbol,
          rank: item.rank,
          price_usd: item.price_usd,
          price_btc: item.price_btc,
          volume_usd_24h: item['24h_volume_usd'],
          market_cap_usd: item.market_cap_usd,
          available_supply: item.available_supply,
          total_supply: item.total_supply,
          max_supply: item.max_supply,
          percent_change_1h: item.percent_change_1h,
          percent_change_24h: item.percent_change_24h,
          percent_change_7d: item.percent_change_7d,
          last_updated: item.last_updated,
          stamp: item.stamp
        }
      })
    })
  }

}
