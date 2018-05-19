import { Component, OnInit } from '@angular/core';
import {MarketCapService} from '../market-cap.service';

@Component({
  selector: 'app-coins-list',
  templateUrl: './coins-list.component.html',
  styleUrls: ['./coins-list.component.css']
})
export class CoinsListComponent implements OnInit {


  // listEchangeCoin:VOExchangeCoin[];
  constructor(
   // private service:MarketCapService
  ) { }

  ngOnInit() {
   /* this.service.getCoinsExchanges().subscribe(res=>{
      if(!res) return;

      this.listEchangeCoin = res;

    })*/
  }

}
