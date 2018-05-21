import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApisPublicService} from '../../apis/apis-public.service';
import {MarketCapService} from '../../market-cap/services/market-cap.service';

@Component({
  selector: 'app-analyze-coin',
  templateUrl: './analyze-coin.component.html',
  styleUrls: ['./analyze-coin.component.css']
})
export class AnalyzeCoinComponent implements OnInit {

  coin: string;
  exchange: string;
  market: string;
  amountUS = 1000;
  allMarkets: { exchange: string, market: string }[];
  constructor(
    private route: ActivatedRoute,
    private apiPublic: ApisPublicService,
    private marketCap: MarketCapService
  ) {
  }

  ngOnInit() {

    this.route.params.subscribe(params => {
     // console.log(params)
      let coin = params.coin;
      this.coin = coin;
      this.exchange = params.exchange;
      this.market = 'BTC_' + coin;

      this.apiPublic.getAvailableMarketsForCoin(coin).subscribe(res => {
        //  console.warn(res);
        this.marketCap.getCoinsObs().subscribe(MC => {
          this.allMarkets = res;

        })
      })

    });
  }

  onMarketClick(item){
    console.log(item);
    this.market = item.market;
    this.exchange = item.exchange;
  }

  onAmountlick(evt){
    this.amountUS = Number(evt);
  }

}
