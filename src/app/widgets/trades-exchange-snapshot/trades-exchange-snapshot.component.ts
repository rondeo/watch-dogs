import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {VOMarketCap, VOOrder} from '../../models/app-models';
import {UtilsOrder} from '../../com/utils-order';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {ShowExternalPageService} from '../../services/show-external-page.service';
import * as _ from 'lodash';

export interface VOMarketSnapshot {
  buy: VOOrder[],
  sell: VOOrder[],
  bubbles: any[],
  min: number,
  max: number,
  sumBuy: number,
  sumSell: number,
  dustCountBuy: number,
  dustCountSell: number,
  fishes: VOOrder[],
  speed: number,
  duration: number,
  tolerance: number
}

export const VO_MARKET_SNAPSHOT = {
  buy: [],
  sell: [],
  bubbles: [],
  min: 0,
  max: 0,
  sumBuy: 0,
  sumSell: 0,
  dustCountBuy: 0,
  dustCountSell: 0,
  speed: 0,
  duration: 0,
  tolerance: 0,
  fishes: []
}


@Component({
  selector: 'app-trades-exchange-snapshot',
  templateUrl: './trades-exchange-snapshot.component.html',
  styleUrls: ['./market-snapshot.component.css']
})
export class TradesExchangeSnapshotComponent implements OnInit {

  @Input() exchange: string;
  @Input() market: string;

  analytics: VOMarketSnapshot;
  priceBaseUS: number;
  coinPriceUS: number;

  private baseMC: VOMarketCap;
  private coinMC: VOMarketCap;
  private allCoins: { [symbol: string]: VOMarketCap };

  private marketHistory: VOOrder[];
  fishes: VOOrder[];
  amountFishUS: number = 0;


  exchanges: string[];

  isRefreshingHistory: boolean;

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService,
    private showMarket: ShowExternalPageService
  ) {


  }

  ngOnChanges(evt: SimpleChanges) {
   // console.log(' onchanges ');
    this.initAsync();
  }

  ngOnInit() {
   // console.log(' ngOnInit  ')
    this.analytics = VO_MARKET_SNAPSHOT;
  }

  async initAsync() {
    //console.log('initAsync   ')
    let pair = this.market;
    if (!pair || pair.indexOf('_') === -1) return;
    let ar = pair.split('_');
    let base = ar[0];
    let coin = ar[1];
    this.allCoins = await this.apiMarketCap.getTicker();
    this.baseMC = this.allCoins[base];
    this.priceBaseUS = this.baseMC ? this.baseMC.price_usd : -1;
    this.coinMC = this.allCoins[coin];
    this.coinPriceUS = this.coinMC ? this.coinMC.price_usd : -1;
    this.downloadHistory();
  }


  async downloadHistory() {
   // console.log('download history')
    this.isRefreshingHistory = true;
    if (!this.exchange) return;
    if (!this.baseMC || !this.coinMC) return;
    const api = this.apisPublic.getExchangeApi(this.exchange);
    if (!api) throw new Error(' no api for ' + this.exchange);
    const history: VOOrder[] = await api.downloadMarketHistory(this.baseMC.symbol, this.coinMC.symbol).toPromise();
    this.marketHistory = history;

    // console.log(coindatas);
    if (!history) throw new Error('No coindatas base: ' + this.baseMC.symbol + ' coin: ' + this.coinMC.symbol);
    this.analytics = UtilsOrder.analizeOrdersHistory(history, this.priceBaseUS);
    this.isRefreshingHistory = false

  }


  onRefreshHistory() {
    this.downloadHistory();
  }

  calculeteFishes() {
    if (!this.amountFishUS) return;
    const history = this.marketHistory;
    const basePrice = this.baseMC.price_usd;
    const priceCoin = this.coinMC.price_usd
    // console.log(history, basePrice);
    const amount = this.amountFishUS / priceCoin;
    // console.log(history);
    this.fishes = history.filter(function (item) {
      return item.amountCoin > amount;
    }).sort(function (a, b) {
      return b.timestamp - a.timestamp;
    })
  }

  onAmountFishChanged(evt) {
    this.calculeteFishes();
  }

  onMarketClick() {
    const ar = this.market.split('_');
    this.showMarket.showMarket(this.exchange, ar[0], ar[1]);
  }

  showFishes3(){

    const fishes =  this.marketHistory.sort(function (a, b) {
      return b.amountCoin - a.amountCoin;
    }).slice(0,3);
    const last = _.last(fishes);
    this.fishes = fishes.sort(function (a, b) {
      return b.timestamp - a.timestamp;
    });
    this.amountFishUS = Math.round(last.amountCoin * last.rate * this.priceBaseUS);
  }
  onFishClick(){
    if(this.fishes && this.fishes.length) {
      this.fishes = [];
      return;
    }
    this.showFishes3();
  }

}
