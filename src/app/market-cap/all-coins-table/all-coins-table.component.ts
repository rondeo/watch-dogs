import {Component, OnInit} from '@angular/core';

import * as _ from 'lodash';

import {VOMarketCap} from '../../models/app-models';

import {MarketCapService} from '../services/market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import {filterSelected} from '../../shared/utils';
import {ApiMarketCapService} from '../../apis/api-market-cap.service';
import {VOMC} from '../../apis/models';

@Component({
  selector: 'app-all-coins-table',
  templateUrl: './all-coins-table.component.html',
  styleUrls: ['./all-coins-table.component.css']
})


export class AllCoinsTableComponent implements OnInit {
  allCoinsData:VOMC[];
  average1h:number;
  average24h:number;
  average7d:number;
  creteria:string;
  asc_desc='asc';
  constructor(
    private marketCap:ApiMarketCapService,
    private storage:StorageService
  ) { }

  ngOnInit() {
    this.iniiAsync();
  }

  async iniiAsync(){
    this.allCoinsData = await this.marketCap.getCoinsArWithSelected();
  }

  calculateAvarage(){
    let ar  = this.allCoinsData;
    if(!ar || !ar.length ) return;
    let length = ar.length;

    this.average1h = +(_.sumBy(ar, 'percent_change_1h')/length).toFixed(2);
    this.average24h = +(_.sumBy(ar, 'percent_change_24h')/length).toFixed(2);
    this.average7d = +(_.sumBy(ar, 'percent_change_7d')/length).toFixed(2);
  }


  onCoinSelected(event, coin:VOMarketCap):void {
   // console.log(event.target.checked, coin);
    let symbol = coin.symbol;
    if(event.target.checked) this.storage.addMCSelected(symbol);
    else this.storage.deleteSelectedMC(symbol);
  }

  onClickHeader(creteria:string):void{
    // console.log(creteria);
    if(this.creteria === creteria){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
   //  console.log(this.asc_desc);

    this.allCoinsData = _.orderBy(this.allCoinsData, creteria, this.asc_desc);
    this.creteria = creteria;

  }

}
