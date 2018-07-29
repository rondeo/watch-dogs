import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ApisPublicService} from '../../apis/apis-public.service';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ShowExternalPageService} from '../../services/show-external-page.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCAgregated} from '../../models/api-models';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {MATH} from '../../com/math';
import {MongoService} from '../../apis/mongo.service';
import * as moment from 'moment';


@Component({
  selector: 'app-analyze-coin',
  templateUrl: './analyze-coin.component.html',
  styleUrls: ['./analyze-coin.component.css']
})
export class AnalyzeCoinComponent implements OnInit {

  @ViewChild('amount') amoubtView: ElementRef;

  coin: string;
  coinMC: VOMarketCap = new VOMarketCap()
  baseMC:VOMarketCap = new VOMarketCap();
  exchange: string;
  market: string;
  amountUS = 1000;
  coinPriceMC: number;
  allMarkets: { exchange: string, market: string }[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private showExtranPage: ShowExternalPageService,
    private mongoBTC: MongoService
  ) {
  }




  ngOnInit() {

    this.mongoBTC.downloadBTCLarge('2018-07-16T02:26:43-04:00', moment('2018-07-16T02:26:43-04:00').subtract(1, 'd').format()).then(res =>{
      console.log(res);
    })

    // console.warn(MATH.medianOn([3, 5, 4, 7, 1, 1, 2, 3, 10, 10, 1000, 19999], 5));

    this.route.params.subscribe(params => {
      // console.log(params)
      let coin = params.coin;

      this.exchange = params.exchange;
      if (!this.market) this.market = 'BTC_' + coin;
      if (this.coin !== coin) {
        this.coin = coin;
        this.gatherAllMarketsForCoin();
      }

    });
  }

  async gatherAllMarketsForCoin(){
    if(!this.coin) return;
    const markets = await this.apiPublic.getMarketAllExchanges('BTC', this.coin);
    console.log(markets);
   /* this.apiPublic.getAvailableMarketsForCoin(coin).subscribe(res => {
      //  console.warn(res);
      this.marketCap.downloadTicker().toPromise().then(MC => {
        this.coinPriceMC = MC[coin].price_usd;
        this.coinMC = MC[coin];
        this.baseMC = MC['BTC'];
        this.allMarkets = res;
      })
    })*/

  }

  isDisabled() {
    return !this.exchange || !this.market;
  }

  onLineChartClick() {
    if (this.exchange && this.market) {
      const ar = this.market.split('_')
      this.showExtranPage.showMarket(this.exchange, ar[0], ar[1]);
    }
  }


  onMarketExchangeChange(evt: { exchange: string, market: string }) {
    this.market = evt.market;
    const coin = this.market.split('_')[1];
    this.router.navigate(['/trader/analyze-coin/' + coin + '/' + evt.exchange]);

  }

  onAmountChanged(amount: number){
    this.amountUS = amount;
  }

}
