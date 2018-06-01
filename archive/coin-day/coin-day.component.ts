import {Component, OnInit} from '@angular/core';

import * as _ from 'lodash';
import {ActivatedRoute} from "@angular/router";
import * as moment from "moment";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {VOGraphs} from "../../src/app/shared/line-chart/line-chart.component";

@Component({
  selector: 'app-bot-coin-day',
  templateUrl: './coin-day.component.html',
  styleUrls: ['./coin-day.component.css']
})
export class CoinDayComponent implements OnInit {
  myGraps: VOGraphs;
  fromMC: string;
  toMC: string;
  fromBittrex: string;
  toBittrex: string;
  form: FormGroup;
  private coin;

  constructor(
              private fb: FormBuilder,
              private route: ActivatedRoute) {

    this.form = fb.group({
      dateTo: [moment(), Validators.required]

    })
  }

  onChartClicked(evt) {
    console.log(evt);
  }


  onMinus12h() {
    this.form.value.dateTo.subtract(12, 'hours');
    this.onGoClick();
  }

  onPlus12h() {
    this.form.value.dateTo.add(12, 'hours');

    this.onGoClick();
  }

  onGoClick() {

    let values = this.form.value;

    let to = values.dateTo.format().slice(0, -6);

    console.log(to);

    //this.to = to.replace('T',' ');
    let from = values.dateTo.clone().subtract(1, 'day').format().slice(0, -6);
    //this.from = from.replace('T',' ');
    console.log(from);
    let coin = this.coin;

   /* this.coinDay.getCoinDayMarketCap(coin, from, to).subscribe((mc: any) => {
      // console.log(mc);
      this.fromMC = _.first(mc.stamps).slice(5, -3).replace('-', '/');
      this.toMC = _.last(mc.stamps).slice(5, -3).replace('-', '/');
      let steps = mc.stamps;

      let d = Math.round(steps.length / 11);
      console.log(d);

      let vals = steps.filter(function (item, i) {
        return (i % d) == 0;
      });

      vals = vals.map(function (item: string) {
        return item.slice(11, -3);
      });

      let base = 'BTC';
      if (this.coin === 'BTC') base = 'USDT';
     // this.coinDay.getOrdersHistoryPoloniex(base, coin, from, to).subscribe(bitfibex_USDT_BTC=>{
       // console.log(bitfibex_USDT_BTC);


     // this.coinDay.getCoinDayBittrex(base, coin, from, to).subscribe((bittrex: MarketDay) => {
       // this.coinDay.getCoinDayPoloniex(base, coin, from, to).subscribe((poloniex: MarketDay) => {
        //  this.coinDay.getCoinDayBitfinex(base, coin, from, to).subscribe((bitfinex: MarketDay) => {
            //this.coinDay.getCoinDayHitbtc(base, coin, from, to).subscribe((hitbtc: MarketDay) => {
              //this.coinDay.getCoinDayCryptopia(base, coin, from, to).subscribe((cryptopia: MarketDay) => {
              // console.log(bitfinex);

              //this.fromBittrex = _.first(bittrex.stamps).slice(5, -3).replace('-', '/');
              //this.toBittrex = _.last(bittrex.stamps).slice(5, -3).replace('-', '/');


              this.myGraps = {
                xs: vals,
                graphs: [
                   {
                     ys: mc.price_usd,
                     color: '#b57419',
                     label: 'MC'
                   },
                   {
                     ys: mc.volume_usd_24h,
                     color: '#000000',
                     label: 'Volume'
                   }
                  /!*{
                    ys: bittrex.Last,
                    color: '#FF00FF',
                    label: 'Bittrex'
                  },*!/
                 /!* {
                    ys: poloniex.Last,
                    color: '#14af60',
                    label: 'Poloniex'
                  },*!/
                 /!* {
                    ys: bitfinex.Last,
                    color: '#779dff',
                    label: 'Bitfinex'
                  },*!/
                  /!* {
                 ys: bitfibex_USDT_BTC.totals,
                 color: '#c1c037',
                 label: 'Hitbtc'
               },*!/
                 /!* {
                    ys: bitfibex_USDT_BTC.buys,
                    color: '#1fc1a0',
                    label: 'Hitbtc'
                  },*!/
                  /!* {
                     ys: cryptopia.Last,
                     color: '#c1c037',
                     label: 'Hitbtc'
                   }*!/

                  /!* {
                     ys: hitbtc.Last,
                     color: '#c1c037',
                     label: 'Hitbtc'
                   },*!/
                 /!* {
                    ys: cryptopia.Last,
                    color: '#c1c037',
                    label: 'Hitbtc'
                  }*!/

                ]
              };

          //  });
      //});
         // });
          //});
        //});
    });
*/
  }

  ngOnInit() {
    this.route.params.subscribe(paramas => {
      let coin = paramas.coin;
      console.log(coin);
      this.coin = coin;

    });
  }


}
