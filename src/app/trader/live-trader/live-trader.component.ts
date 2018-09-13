import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-live-trader',
  templateUrl: './live-trader.component.html',
  styleUrls: ['./live-trader.component.css']
})
export class LiveTraderComponent implements OnInit {

  exchange: string;
  market: string;
  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params =>{
      this.exchange = params.exchange;
      this.market = params.market;
      console.log(params);

    })

  }

}
