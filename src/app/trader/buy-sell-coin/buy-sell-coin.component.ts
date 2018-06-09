import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOBalance} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/services/market-cap.service';
import {ApiPrivateAbstaract} from '../../apis/api-private/api-private-abstaract';
import {ApisPrivateService} from '../../apis/apis-private.service';
import {VOMCAgregated} from '../../models/api-models';

@Component({
  selector: 'app-buy-sell-coin',
  templateUrl: './buy-sell-coin.component.html',
  styleUrls: ['./buy-sell-coin.component.css']
})
export class BuySellCoinComponent implements OnInit {

  exchange: string;
  market: string;

  balanceCoin: VOBalance;
  balanceBase: VOBalance;

  balanceCoinUS: number;
  balanceBaseUS: number;

  coinMC: VOMCAgregated;
  baseMC: VOMCAgregated;

  base:string;
  coin:string;

  apiPrivate:ApiPrivateAbstaract;
  constructor(
    private route: ActivatedRoute,
    private marketCap: MarketCapService,
    private apisPrivate: ApisPrivateService
  ) {
  }

  ngOnInit() {

    /*this.route.params.subscribe(params => {
      console.log(params);
      this.exchange = params.exchange;
      this.market = params.market;
      const ar = this.market.split('_');
      this.base = ar[0];
      this.coin = ar[1];
      this.marketCap.getCoinsObs().subscribe(MC =>{
        this.baseMC = MC[this.base];
        this.coinMC = MC[this.coin];

        this.downloadBalances();

      })
    });*/
  }

  async downloadBalances(){
   this.balanceBase = await this.apisPrivate.getExchangeApi(this.exchange).downloadBalance(this.base).toPromise();
   this.balanceCoin =  await this.apisPrivate.getExchangeApi(this.exchange).downloadBalance(this.coin).toPromise();
   console.log(this.balanceBase, this.balanceCoin);
  }



}
