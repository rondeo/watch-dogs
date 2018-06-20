import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ApisPublicService} from '../../apis/apis-public.service';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ShowExternalPageService} from '../../services/show-external-page.service';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMCAgregated} from '../../models/api-models';


@Component({
  selector: 'app-analyze-coin',
  templateUrl: './analyze-coin.component.html',
  styleUrls: ['./analyze-coin.component.css']
})
export class AnalyzeCoinComponent implements OnInit {

  @ViewChild('amount') amoubtView: ElementRef;

  coin: string;
  coinMC: VOMCAgregated = new VOMCAgregated();
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
    private showExtranPage: ShowExternalPageService
  ) {
  }

  ngOnInit() {

    this.route.params.subscribe(params => {
      // console.log(params)
      let coin = params.coin;

      this.exchange = params.exchange;
      if (!this.market) this.market = 'BTC_' + coin;
      if (this.coin !== coin) {


        this.apiPublic.getAvailableMarketsForCoin(coin).subscribe(res => {
          //  console.warn(res);
          this.marketCap.getData().then(MC => {
            this.coinPriceMC = MC[coin].price_usd;
            this.coinMC = MC[coin];
              this.allMarkets = res;
          })
        })
      }

      this.coin = coin;

    });
  }

  isDisabled() {
    return !this.exchange || !this.market;
  }

  onLineChartClick() {
    if (this.exchange && this.market) {
      const ar = this.market.split('_')
      ShowExternalPageService.showMarket(this.exchange, ar[0], ar[1]);
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
