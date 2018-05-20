import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-analyse-coin',
  templateUrl: './analyse-coin.component.html',
  styleUrls: ['./analyse-coin.component.css']
})
export class AnalyseCoinComponent implements OnInit {

  coin:string;
  exchange: string;
  market:string;
  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      console.log(params)
     let coin = params.coin;
     this.coin = coin;
     this.exchange = params.exchange;
     this.market = 'BTC_' + coin;

     /*this.cryptoCompare.getSocialStats(coin).subscribe(res => {
       console.log(res);
     })*/


    // this.filterDay();

   });
  }

}
