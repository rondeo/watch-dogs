import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {VOOrder} from '../../models/app-models';
import {UtilsOrder} from '../../services/utils-order';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCAgregated} from '../../apis/models';
import {ApisPublicService} from '../../apis/apis-public.service';

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
  selector: 'app-market-snapshot',
  templateUrl: './market-snapshot.component.html',
  styleUrls: ['./market-snapshot.component.css']
})
export class MarketSnapshotComponent implements OnInit {

  @Input() exchange: string;
  @Input() market: string;

  analytics: VOMarketSnapshot;
  priceBaseUS: number;
  coinPriceUS: number;
  private baseMC: VOMCAgregated;
  private coinMC: VOMCAgregated;
  private allCoins: { [symbol: string]: VOMCAgregated };


  exchanges: string[];


  isRefreshingHistory:boolean;

  constructor(
    private apiMarketCap: ApiMarketCapService,
    private apisPublic: ApisPublicService
  ) {


  }

  ngOnChanges(evt: SimpleChanges){
    this.ngOnInit();
  }

  ngOnInit() {
    this.analytics = VO_MARKET_SNAPSHOT;
    let pair = this.market;
    if (!pair || pair.indexOf('_') === -1) return;
    let ar = pair.split('_');
    let base = ar[0];
    let coin = ar[1];


    this.apiMarketCap.getData().subscribe(allCoins => {
      this.allCoins = allCoins;
      this.baseMC = allCoins[base];
      this.priceBaseUS = this.baseMC.price_usd;
      this.coinMC = allCoins[coin];
      this.coinPriceUS = this.coinMC.price_usd;
      this.downloadHistory();
    })

  }



 async downloadHistory() {
    this.isRefreshingHistory = true;
    const api = this.apisPublic.getExchangeApi(this.exchange);
    if(!api) throw new Error(' no api for ' + this.exchange);
    const history: VOOrder[] = await api.downloadMarketHistory(this.baseMC.symbol, this.coinMC.symbol).toPromise();
   // console.log(history);
   if (!history) throw new Error('No history base: '+ this.baseMC.symbol + ' coin: ' + this.coinMC.symbol);
   this.analytics = UtilsOrder.analizeOrdersHistory(history, this.priceBaseUS);
   this.isRefreshingHistory = false

  }

  onRefreshHistory(){
    this.downloadHistory();
  }

}
