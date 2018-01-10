import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {VOMarket, VOMarketCap} from '../../models/app-models';
import * as _ from 'lodash';
import {AllCoinsService} from '../all-coins.service';
import {MarketCapService} from '../../market-cap/market-cap.service';

@Component({
  selector: 'app-all-gainers-losers',
  templateUrl: './all-gainers-losers.component.html',
  styleUrls: ['./all-gainers-losers.component.css']
})
export class AllGainersLosersComponent implements OnInit {
  creteria: string ='percent_change_1h' ;

  exchange:string;
  data:VOMarket[] =[];
  sortedMarkets:VOMarket[] =[];
  asc_desc = 'asc';
  sortBy = 'persent_24h';
  constructor(
    private route:ActivatedRoute,
    private allService:AllCoinsService,
    private marketCap:MarketCapService
  ) { }

  private timeout;
  ngOnInit() {


    this.allService.selectedMarketsAr$.subscribe(markets=>{

      if(!markets) return;
      console.log(markets);
      this.data = markets.filter(function (item) {
        return !!item.percent_change_24h;
      });

      clearTimeout(this.timeout);
      this.timeout = setTimeout(()=>this.sortData(),500);
     /* this.marketCap.getAllCoinsData().subscribe(data=>{
       // console.log(coins);

        if(!data) return;
        let ar = coins.map(function (item) {
          return this.mc[item] || {symbol:item};
        },{mc:data});

        this.data = ar;
        this.sortData();

      })*/
    });

    this.allService.loadCoinsSelectedExchanges();

    /*this.allService.currentMarketsAr$.subscribe(markets=>{
      if(!markets) return;
     // console.log(markets);
     this.data = markets;
      this.filterCurrent();
    });

    this.route.params.subscribe(params=> {
      console.log(params);
      this.exchange = params.exchange;
      if(this.exchange) this.allService.setCurrentExchangeById(this.exchange);
    });*/



     // this.allService.setCurrent(params.exchange);
  }



  onSortClick(creteria:string){

    if(this.creteria == creteria){
      this.asc_desc = this.asc_desc ==='asc'?'desc':'asc';
    }
    this.creteria = creteria;

    this.sortData();
  }



  filterCurrent(){

    this.sortData();

  }


  sortData(){

    if(!Array.isArray(this.data)) return;
    let ar = this.data;
   // let creteria = this.creteria
    /* percent_change_1h:number;
  percent_change_24h:number;
  percent_change_7d:number;*/
    console.log( this.creteria, this.asc_desc);
   this.sortedMarkets = _.take( _.orderBy(ar, this.creteria, this.asc_desc), 200);

    // console.log(sorted);
   // this.consAvailable = _.take(sorted,30);
  }



}
