import {Injectable} from '@angular/core';
import {ConnectorApiService} from "../../my-exchange/services/connector-api.service";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {HttpClient} from "@angular/common/http";
import {VOBalance, VOMarket, VOMarketCap, VOWatchdog} from "../../models/app-models";
import {ApisPublicService} from "../../apis/apis-public.service";
import {ApisPrivateService} from "../../apis/apis-private.service";
import * as moment from "moment";
import {StorageService} from "../../services/app-storage.service";
import {MY_WATCHDOGS} from "../../email-service/watch-dog.service";

export interface VOProcessCoin {
  exchange: string
  base: string
  coin: string
  coinPrice?: number
  basePrice?: number;
  balance?: number;
  action: string;
  priceDiff?: number;
  uuid?: string;
  timestamp?: string
  script?: string;
}

@Injectable()
export class BotSellCoinService {

  toSell: VOProcessCoin[] = [];


  constructor(
    private http: HttpClient,
    private apisPublic: ApisPublicService,
    private apisPrivate: ApisPrivateService,
    private storage: StorageService
  ) {


  }


  trackCoin(coin: VOProcessCoin) {
    this.apisPrivate.getExchangeApi(coin.exchange).getOrder(coin.uuid).subscribe(res => {
      console.warn(res);
    })

  }

  async getCoinsToSell():Promise<VOWatchdog[]> {
    return this.storage.select(MY_WATCHDOGS).then(dogs => {
      return dogs.filter(function (item) {
        return item.action === 'SELL';
      });
    });
  }

  sellCoin(market: VOProcessCoin): boolean {
    const exists = this.toSell.find(function (item) {
      return item.exchange === market.exchange && item.base === market.base && item.coin === market.coin;
    });


    if (exists) return false
    this.toSell.push(market);
    this.sellAllCoins();
    return true;
  }


  private sellAllCoins() {
    if (this.toSell.length === 0) {
      console.log(' no coins to sell');
      return;
    }
    const toSell = this.toSell;
    const coin = toSell[0];

    // coin.uuid = 'd01fef47-c02c-4b00-9fb5-56b9b71c905a';
    if (coin.uuid) this.trackCoin(coin);
    else this.apisPrivate.getExchangeApi(coin.exchange)
      .sellCoin(coin)
      .subscribe((coin: VOProcessCoin) => {
        console.warn(coin);

        this.saveOnServer(coin.exchange + coin.coin, coin).then(res => {
          console.warn(res);
        })
      })

  }


  saveOnServer(filename: string, payload: VOProcessCoin) {
    payload.timestamp = moment().format();
    let url = 'api/save-data/';
    console.log(url);
    return this.http.post(url, {filename, payload}).toPromise();

  }


  private _markets: any[];
  get markets() {
    if (!this._markets) this._markets = JSON.parse(localStorage.getItem('bot-sell-coin') || '[]');
    return this._markets;
  }


  addMarket(exchange: string, base: string, coin: string) {
    let id = exchange + '_' + base + '_' + coin;
    let exists = this.markets.find(function (item) {
      return item.exchange === exchange && item.base === base && item.coin === coin;
    });

    if (!exists) this.markets.push({
      exchange,
      base,
      coin
    });
    this.saveMarkets()
  }

  deleteMarket(exchange: string, base: string, coin: string) {
    let ar = this.markets;
    for (let i = ar.length - 1; i >= 0; i--) {
      let m = ar[i];
      if (m.exchange === exchange && m.base === base && m.coin === coin) ar.splice(i, 1);
    }
    this.saveMarkets();

  }

  saveMarkets() {
    localStorage.setItem('bot-sell-coin', JSON.stringify(this.markets))
  }

}
