import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApisPublicService} from '../../apis/apis-public.service';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ShowExternalPageService} from '../../services/show-external-page.service';


@Component({
  selector: 'app-analyze-coin',
  templateUrl: './analyze-coin.component.html',
  styleUrls: ['./analyze-coin.component.css']
})
export class AnalyzeCoinComponent implements OnInit {

  @ViewChild('amount') amoubtView:ElementRef;

  coin: string;
  exchange: string;
  market: string;
  amountUS = 1000;
  coinPriceMC: number;
  allMarkets: { exchange: string, market: string }[];
  constructor(
    private route: ActivatedRoute,
    private apiPublic: ApisPublicService,
    private marketCap: MarketCapService,
    private showExtranPage: ShowExternalPageService
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
          this.coinPriceMC = MC[coin].price_usd;
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
    let  am  = Number(evt);

    if(am < 10){
      am = 10;
      this.amoubtView.nativeElement.value = am
    }
    this.amountUS = am;
  }


  onExchangeMarketClick(){
    const ar = this.market.split('_')
    this.showExtranPage.showMarket(this.exchange, ar[0], ar[1]);
  }

}
