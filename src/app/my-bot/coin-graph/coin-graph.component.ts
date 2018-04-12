import {Component, OnInit} from '@angular/core';
import {ApiMarketCapService} from "../../apis/api-market-cap.service";
import {ActivatedRoute} from "@angular/router";
import {VOGraphs} from "../../shared/line-chart/line-chart.component";

@Component({
  selector: 'app-coin-graph',
  templateUrl: './coin-graph.component.html',
  styleUrls: ['./coin-graph.component.css']
})
export class CoinGraphComponent implements OnInit {

  myGraps: VOGraphs;

  constructor(private route: ActivatedRoute,
              private marketcap: ApiMarketCapService) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const coin = params.coin;
      if (!coin) return;
     // this.marketcap.getCoinDay(coin).subscribe(res =>{
     //   console.log(res);
     // });
      this.marketcap.getCoinHistoryLast(coin, 100).subscribe(res => {
        //  console.log(res);

        this.myGraps = {
          xs: res.labels,
          graphs: [
            {
              ys: res.volume_usd_24h,
              color: '#4a8abc',
              label: 'Volume'
            },
            {
              ys: res.price_usd,
              color: '#880b49',
              label: 'price'
            }
            /*{
              ys: res.market_cap_usd,
              color: '#14886f',
              label: 'Cap '
            },
            {
              ys: res.available_supply,
              color: '#c1c037',
              label: 'Availble '
            },
            {
              ys: res.total_supply,
              color: '#1d1588',
              label: 'Total '
            }
*/
          ]
        }

      })
    })
  }

}
