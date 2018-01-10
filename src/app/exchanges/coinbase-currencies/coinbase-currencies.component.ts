import { Component, OnInit } from '@angular/core';
import {CoinbaseService, VOCBCurrency} from '../services/coinbase.service';

@Component({
  selector: 'app-coinbase-currencies',
  templateUrl: './coinbase-currencies.component.html',
  styleUrls: ['./coinbase-currencies.component.css']
})
export class CoinbaseCurrenciesComponent implements OnInit {

  collection:VOCBCurrency[];
  constructor(private service:CoinbaseService) { }

  ngOnInit() {

    this.service.getCurencies().subscribe(res=>{
     // console.log(res);
      this.collection = res;
      this.service.getExchange('BTC').subscribe(market=>{
       // console.log(market);
        res.forEach(function (item) {

          item.btc = market[item.code];

        })
      })
      this.service.getExchange('ETH').subscribe(market=>{
        // console.log(market);
        res.forEach(function (item) {

          item.eth = market[item.code];

        })
      })
    })
  }

}
