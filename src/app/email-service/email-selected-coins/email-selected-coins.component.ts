import { Component, OnInit } from '@angular/core';


import * as _ from 'lodash';
import {VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {StorageService} from '../../services/app-storage.service';
import {SelectedCoinsComponent} from "../../market-cap/selected-coins/selected-coins.component";


@Component({
  selector: 'app-email-selected-coins',
  templateUrl: './email-selected-coins.component.html',
  styleUrls: ['./email-selected-coins.component.css']
})
export class EmailSelectedCoinsComponent implements OnInit {

  selectedCoins:VOMarketCap[] = [];
  constructor(
   private marketCapService:MarketCapService,
   private storage:StorageService
  ) { }

  ngOnInit() {

    /*this.marketCapService.coinsAr$.subscribe(res=>{
      // console.log(res);
      if(!res){
        console.log(' no reports refreshing MC')
        this.marketCapService.refresh();
        return;
      }
      this.selectedCoins = SelectedCoinsComponent.filterSelected(res, this.storage.getSelectedMC());


    });*/
  }

  setCoins(ar:VOMarketCap[]){

    this.selectedCoins = ar;
  }


}
