import { Component, OnInit } from '@angular/core';
import {KrakenService, VOKMarket} from '../services/kraken.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-kraken',
  templateUrl: './kraken.component.html',
  styleUrls: ['./kraken.component.css']
})
export class KrakenComponent implements OnInit {

  //market:{[kid:string]:VOKMarket};
  marketsAr:VOKMarket[];

  constructor(private serveice:KrakenService) { }

  ngOnInit() {
    this.serveice.getCurencies().subscribe(res=>{
      console.log(res);
     // this.market = res;
      this.marketsAr =res;
    })
  }

  onMarketClick(market: VOKMarket) {
    let kid = market.kid;
    this.serveice.getMarket(kid).subscribe(res=>{
      console.log(res);
      let v = res[kid];
      market.a=v.a;
      market.b=v.b;
      market.c=v.c;
      market.h=v.h;
      market.l=v.l;
      market.o=v.o;
      market.p=v.p;
      market.t=v.t;
      market.v=v.v;

    })


  }
}
