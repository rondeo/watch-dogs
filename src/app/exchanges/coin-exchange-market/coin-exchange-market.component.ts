import { Component, OnInit } from '@angular/core';
import {CoinEchangeService, VOCECoin} from '../services/coin-echange.service';

@Component({
  selector: 'app-coin-exchange-market',
  templateUrl: './coin-exchange-market.component.html',
  styleUrls: ['./coin-exchange-market.component.css']
})
export class CoinExchangeMarketComponent implements OnInit {

  allCoins:VOCECoin[] = [];

  constructor( private service:CoinEchangeService) { }

  ngOnInit() {

    this.service.getMarket().subscribe(res=>{
      //console.log(res);
      this.allCoins = res;
    })
  }

}
