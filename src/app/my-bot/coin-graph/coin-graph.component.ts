import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOGraphs} from "../../shared/line-chart/line-chart.component";
import * as moment from "moment";
import * as _ from 'lodash';
import {VOMarketCap} from "../../models/app-models";
import {CoinDayService} from "../../apis/coin-day.service";
import {ApiAllPublicService} from "../../apis/api-all-public.service";
@Component({
  selector: 'app-coin-graph',
  templateUrl: './coin-graph.component.html',
  styleUrls: ['./coin-graph.component.css']
})
export class CoinGraphComponent implements OnInit {

  myGraps: VOGraphs;
  coinMC: VOMarketCap;

  coin:string;
  from: string;
  to: string;

  constructor(private route: ActivatedRoute,
              private marketcap: ApiMarketCapService,
              private coinDay: CoinDayService,
              private allPublic:ApiAllPublicService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const coin = params.coin;
      if (!coin) return;
      this.coin = coin;
      this.marketcap.getCoin(coin).then(res =>this.coinMC = res);
      const to = moment().format();
      this.getCoinHistory(to);
    })
  }

  async getCoinHistory( to){

    const from = moment(to).subtract(1, 'd').format();
    const base = 'BTC';
    const coin = this.coin;

    var exchange = 'bittrex';
    var coins:{[symbol:string]:any};

    coins = await this.allPublic.getExchangeApi(exchange);
    var bittrex;
    if(coins[coin]){
      bittrex = await this.coinDay.getCoinDayBittrex(base, coin, from, to).toPromise();
    } else console.warn(coin +' not on ' + exchange);


    const binance = await this.coinDay.getCoinDayBinance(base, coin, from, to).toPromise();

    const hitbtc = await this.coinDay.getCoinDayHitbtc(base, coin, from, to).toPromise();

    console.log(binance);


    this.marketcap.getCoinHistory(this.coin, from, to).subscribe(res => {
      console.log(res);
      this.from = _.first(res.stamps);
      this.to = _.last(res.stamps);

      this.myGraps = {
        xs: res.labels,
        graphs: [
          {
            ys: res.volume_usd_24h,
            color: '#0d9abc',
            label: 'Volume'
          },
          {
            ys: res.price_usd,
            color: '#880b49',
            label: 'price'
          },
          {
            ys: binance.Last,
            color: '#14886f',
            label: 'Binance'
          },
          {
            ys: hitbtc.Last,
            color: '#c1c037',
            label: 'Hitbtc '
          }
          /*
          {
            ys: res.total_supply,
            color: '#1d1588',
            label: 'Total '
          }
*/
        ]
      }

    })
  }

  onMinus12h() {
    const to = moment(this.to).subtract(12, 'hours').format();
    this.getCoinHistory(to);
  }

  onPlus12h() {
    const to = moment(this.to).add(12, 'hours').format();
    this.getCoinHistory(to);
  }

}
