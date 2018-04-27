import {Component, OnInit} from '@angular/core';

import * as _ from 'lodash';

import {VOMarketCap} from '../../models/app-models';

import {MarketCapService} from '../market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import {filterSelected} from '../../shared/utils';

@Component({
  selector: 'app-all-coins-table',
  templateUrl: './all-coins-table.component.html',
  styleUrls: ['./all-coins-table.component.css']
})


export class AllCoinsTableComponent implements OnInit {

  //@Input() selectedSymbols:string[];
  //@Output() onSelectedSymbolsChange  = new EventEmitter<string[]>();

  allCoinsData:VOMarketCap[];
  average1h:number;
  average24h:number;
  average7d:number;


  creteria:string;

  asc_desc='asc';

  constructor(
    private allCoinsService:MarketCapService,
    private storage:StorageService
  ) { }

 // ngOnChanges(changes: any) {
   // console.log(changes);

    //this.modelCoins  = changes.allCoins.currentValue;// _.reject(changes.allCoins,'selected')

    //this.doSomething(changes.categoryId.currentValue);

  //}

  ngOnInit() {
    this.allCoinsService.coinsAr$.subscribe(res=>{
      if(res){

        this.storage.mapSelected(res);
        this.allCoinsData = res;
        this.calculateAvarage();
      }//filterSelected(res, this.storage.getSelectedMC());
    });

    this.allCoinsService.refresh();
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
    else this.storage.deleteMCSelected(symbol);
  }

  onClickHeader(creteria:string):void{
    console.log(creteria);
    if(this.creteria === creteria){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);

    this.allCoinsData = _.orderBy(this.allCoinsData, creteria, this.asc_desc);
    this.creteria = creteria;

  }

}
