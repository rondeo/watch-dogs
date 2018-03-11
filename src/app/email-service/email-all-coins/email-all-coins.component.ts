import { Component, OnInit } from '@angular/core';


import * as _ from 'lodash';
import {VOMarketCap} from '../../models/app-models';

import {AuthHttpService} from '../../services/auth-http.service';

@Component({
  selector: 'app-email-all-coins',
  templateUrl: './email-all-coins.component.html',
  styleUrls: ['./email-all-coins.component.css']
})
export class EmailAllCoinsComponent implements OnInit {

  allCoinsData:VOMarketCap[];
  sortCriteria:string = 'rank';
  asc_desc='asc';
  constructor(
   // private coinsService:MarketCapSelectedService,
    private auth:AuthHttpService
  ) { }

  ngOnInit() {
   // this.coinsService.allCoins$.subscribe(res=>this.allCoinsData = res)
    this.auth.setLastVisited('/email-service');

  }

  onCoinSelected(event, coin:VOMarketCap):void {
    console.log(event.target.checked, coin);
    if(event.target.checked){
   //   this.coinsService.addSelected(coin.symbol);
    }else{
    //  this.coinsService.removeSelected(coin.symbol)
    }






    /*
        let selectedCoinsNames = this.allCoins.reduce(function (reports, item) {
          if(item.selected)  reports.push(item.symbol);
          return reports;
        },[]);


        this.selectedCoinsNamesChange.emit(selectedCoinsNames);*/
  }

  onClickHeader(criteria:string):void{
    console.log(criteria);
    if(this.sortCriteria === criteria){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);

    this.allCoinsData = _.orderBy(this.allCoinsData, criteria, this.asc_desc);
    this.sortCriteria = criteria;

  }

}
