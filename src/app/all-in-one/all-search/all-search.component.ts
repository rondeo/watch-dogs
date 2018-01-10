import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AllCoinsService} from '../all-coins.service';
import {VOMarket, VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {StorageService} from '../../services/app-storage.service';

@Component({
  selector: 'app-all-search',
  templateUrl: './all-search.component.html',
  styleUrls: ['./all-search.component.css']
})
export class AllSearchComponent implements OnInit {

  currentCoin:string;
  currentMC:VOMarketCap;
  selectedCoins:string[];

  searchResult:VOMarket[];
  isProgress:boolean;

  //allCoins:string[];
  constructor(
    private route:ActivatedRoute,
    private service:AllCoinsService,
    private marketCap:MarketCapService,
    private storage:StorageService
  ) { }

  ngOnInit() {
  /*  this.service.allCoins$.subscribe(res=>{
      if(res) this.allCoins = res;
    });*/

  this.selectedCoins = this.storage.getSelectedMC();



    this.service.serachResults$.subscribe(res=>{
      console.log(res);
      if(!res) return;
      this.isProgress = false;
      this.searchResult = res;
    })

    this.currentCoin =  this.route.snapshot.params.coin;
    this.seachCoin();
  }

  private seachCoin(){
    if(!this.currentCoin) return;

   // this.currentMC = this.marketCap.getBySymbol(this.currentCoin);

   // this.searchResult = [];
   // this.isProgress = true;
   // this.service.seachCoin(this.currentCoin);
  }


  onChartClick(market){
    console.log(market);

  }


  onSearchCoinClick(){
    this.seachCoin();
  }


  onCoinSelectChanged(evt){

  //  console.log(evt)
    this.currentCoin = evt.value;
  }
}

