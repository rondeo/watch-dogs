import { Component, OnInit } from '@angular/core';
import {MarketCapService} from '../market-cap.service';
import {VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {Router} from '@angular/router';

@Component({
  selector: 'app-gainers-losers',
  templateUrl: './gainers-losers.component.html',
  styleUrls: ['./gainers-losers.component.css']
})
export class GainersLosersComponent implements OnInit {

  asc_desc='desc';

  allCoins:VOMarketCap[];
  top100:VOMarketCap[];

  sortBy:string = 'percent_change_24h';

  constructor(
    private router:Router,
    private marketCap:MarketCapService
  ) { }


  onSymbolClick(mc:VOMarketCap){

   // let symbols:string[] = _.map(this.consAvailable,'symbol');

    this.router.navigateByUrl('/market-cap/coin-exchanges/'+ mc.id);
  }

  private missingImages:string[] = [];
  private misingImagesTimeout;

  ngOnInit() {
    this.marketCap.coinsAr$.subscribe(res=>{
      this.allCoins = res;

      this.sortData();
    });
    this.marketCap.refresh();
  }

  onSymbolSelected(symbol:string){
    console.log(symbol);
  }


  onFilterClick(){

    this.sortData();
  }

  sortData(){
    if(!this.allCoins) return;

    //let cap = this.data.filter(function (item) { return item.volume_usd_24h > this.limit && item.rank < this.rank;}, {limit:this.capLimit, rank:this.rank});

    let sorted =  _.orderBy(this.allCoins, this.sortBy, this.asc_desc);

    // console.log(sorted);
    this.top100= _.take(sorted,100);
  }



  onTableclick(event){

    // console.log(event.srcElement);
    var target = event.target || event.srcElement || event.currentTarget;
    var idAttr = target.attributes.data;

    if(idAttr && idAttr.nodeValue)  console.log(idAttr.nodeValue);

    // var value = idAttr.id;
  }


  onClickHeader(criteria:string):void{
    console.log(criteria);


    if(this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc')?'desc':'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

}
