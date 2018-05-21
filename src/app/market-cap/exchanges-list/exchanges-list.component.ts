import { Component, OnInit } from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-exchanges-list',
  templateUrl: './exchanges-list.component.html',
  styleUrls: ['./exchanges-list.component.css']
})
export class ExchangesListComponent implements OnInit {

  exchangesCoin:any[];

  constructor(
    private service:MarketCapService
  ) { }

  ngOnInit() {
   /* this.service.getCoinsExchanges().subscribe(res=>{
      if(!res) return;
      //console.log(res);
      this.exchangesCoin = res;

    })*/
  }

}
