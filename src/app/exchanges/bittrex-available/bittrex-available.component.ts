import { Component, OnInit } from '@angular/core';
import {BittrexService} from '../services/bittrex.service';
import * as _ from 'lodash';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {VOMarketB} from '../../models/app-models';

@Component({
  selector: 'app-bittrex-available',
  templateUrl: './bittrex-available.component.html',
  styleUrls: ['./bittrex-available.component.css']
})
export class BittrexAvailableComponent implements OnInit {
  sortBy:string;
  asc_desc:string ='desc';
  marketsAr:VOMarketB[];


  constructor(
    private bittrexService:BittrexService,
    private marketCap:MarketCapService
  ) { }

  ngOnInit() {

    /*this.bittrexService.getMarketsAr().subscribe(res=> {

      this.marketsAr = res;
    });*/

  }


  private doSort(ar:VOMarketB[]){
    if(this.sortBy) this.marketsAr = _.orderBy(ar, this.sortBy, this.asc_desc);
    else this.marketsAr = ar;
  }
  onClickHeader(sortBy:string){
    console.log(sortBy);
    if(this.sortBy === sortBy){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);
    this.sortBy = sortBy;
    if(this.marketsAr) this.doSort(this.marketsAr);
  }
}
