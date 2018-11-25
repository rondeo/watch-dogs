import { Component, OnInit } from '@angular/core';

import {ActivatedRoute} from '@angular/router';


@Component({
  selector: 'app-all-main-coins',
  templateUrl: './all-main-coins.component.html',
  styleUrls: ['./all-main-coins.component.css']
})
export class AllMainCoinsComponent implements OnInit {

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params => {
      console.log(params);
    });

    /*this.connector.bitfinex.downloadTrades('USDT', 'BTC').subscribe(res=>{
      console.log(res);
    })*/


  }


}
