import {Component,  OnInit} from '@angular/core';

import * as _ from 'lodash';

import {VOMarketCap} from '../../models/app-models';

import {MarketCapService} from '../market-cap.service';
import {StorageService} from "../../services/app-storage.service";
//import {filterSelected} from '../../shared/utils';

@Component({
  selector: 'app-selected-coins',
  templateUrl: './selected-coins.component.html',
  styleUrls: ['./selected-coins.component.css']
})
export class SelectedCoinsComponent implements OnInit {

  //@Input() modelCoins:VOExchangeData[];

  selectedCoins:VOMarketCap[] = [];
  selected:string[];

  average1h:number;
  average24h:number;
  average7d:number;

  //sortCreteria:string = 'rank';
 // asc_desc='asc';

  constructor(
    private marketCapService:MarketCapService,
    private storage:StorageService
  ) { }

  ngOnInit() {

    this.marketCapService.coinsAr$.subscribe(res=>{
     // console.log(res);
      if(!res){
        console.log(' no reports refreshing MC')
        this.marketCapService.refresh();
        return;
      }
        this.selectedCoins = SelectedCoinsComponent.filterSelected(res, this.storage.getSelectedMC());
      this.calculateAvarage();

    });

  }

  calculateAvarage(){
    let ar  = this.selectedCoins;
    if(!ar || !ar.length ) return;
    let length = ar.length;

    this.average1h = +(_.sumBy(ar, 'percent_change_1h')/length).toFixed(2);
    this.average24h = +(_.sumBy(ar, 'percent_change_24h')/length).toFixed(2);
    this.average7d = +(_.sumBy(ar, 'percent_change_7d')/length).toFixed(2);
  }

  static filterSelected(ar:any[], selected:string[]):any[]{
    return ar.filter(function (item) {
      return selected.indexOf(item.symbol) !==-1;
    })
  }


  /*onClickHeader(creteria:string):void{
    console.log(creteria);
    if(this.sortCreteria === creteria){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);

    this.selectedCoins = _.orderBy(this.selectedCoins, creteria, this.asc_desc);
    this.sortCreteria = creteria;

  }*/



 /* saveSelected(){
    localStorage.setItem('market-cap-selected',JSON.stringify(this.selected));

  }*/

}
