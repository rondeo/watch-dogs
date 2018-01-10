import { Component, OnInit } from '@angular/core';
import {VOExchange} from '../../models/app-models';
import {PoloniexService} from '../services/poloniex.service';

@Component({
  selector: 'app-poloniex-data',
  templateUrl: './poloniex-data.component.html',
  styleUrls: ['./poloniex-data.component.css']
})
export class PoloniexDataComponent implements OnInit {

  marketsAr:VOExchange[];
  constructor(
    private poloniex:PoloniexService
  ) { }

  ngOnInit() {
    this.poloniex.getTicker().subscribe(res =>{
      //console.log(res);

      this.marketsAr = res;
    })

    this.poloniex.getCurrencies().subscribe(res=>{
      console.log(res);
    })
  }

}
