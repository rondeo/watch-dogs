import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOMarketCap} from "../../models/app-models";
import {Router} from "@angular/router";
import * as _ from 'lodash';
import {BittrexService} from "../../exchanges/services/bittrex.service";
import {MatDialog, MatSnackBar} from "@angular/material";
import {MarketViewComponent} from "../../shared/market-view/market-view.component";
import {ConnectorApiService} from "../services/connector-api.service";
import {GainersService} from "../my-exchange-bot/bot/gainers.service";

@Component({
  selector: 'app-my-gainers-losers',
  templateUrl: './my-gainers-losers.component.html'
})

export class MyGainersLosersComponent implements OnInit, OnDestroy {

  asc_desc='desc';

  allCoins:VOMarketCap[];
  top30:VOMarketCap[];

  sortBy:string = 'percent_change_24h';

  constructor(
    private router:Router,
    private apiService:ConnectorApiService,
    private dialog:MatDialog,
    private snackBar:MatSnackBar,
    private myService:GainersService
  ) { }


  private missingImages:string[] = [];
  private misingImagesTimeout;

  private stockQuote;

  ngOnDestroy(){
    if(this.sub) this.sub.unsubscribe();
    if(this.sub1) this.sub1.unsubscribe();
  }
  private sub;
  private sub1;

  ngOnInit() {
    this.sub1 = this.apiService.connector$().subscribe(connector=> {
      if (!connector) return;


      let sub = connector.getCurrencies().subscribe(res=>{
        if(!res) return

        setTimeout(()=>sub.unsubscribe(),50);
        this.allCoins = Object.values(res);
        this.sortData();
      })


    })



  }


  onSymbolClick(mc:VOMarketCap){

    /*let sub =  this.publicService.searchCoinsMarkets([mc.symbol]).subscribe(res=>{

      if(res){

        setTimeout(()=>sub.unsubscribe(),100);
        if(res.length){

          let marketFirst = res[0].pair;
          let ar = marketFirst.split('_')

          this.publicService.getMarketHistory(ar[0], ar[1]).subscribe(hist=>{
            console.log(hist);

          });
          this.dialog.open(MarketViewComponent,{data:res} )
        }else {
          this.snackBar.open('No market for '+mc.symbol, 'x', {duration:3000});
          let allMarkets = this.publicService.getMarketsAr().map(res=>{
            return res.map(function (item) {
              return item.coin;
            })
          }).subscribe((coins)=>{
            console.log(coins);
          })
        }



      }
    })*/

  }

  onShowCartClick(mc:VOMarketCap) {

    // let symbols:string[] = _.map(this.consAvailable,'symbol');
    window.open('https://coinmarketcap.com/currencies/' + mc.id, '_blank');
  }



  onSymbolSelected(symbol:string){
    console.log(symbol);
  }


  onFilterClick(){

    this.sortData();
  }

  sortData(){
    if(!this.allCoins) return;
    let sorted =  _.orderBy(this.allCoins, this.sortBy, this.asc_desc);

    // console.log(sorted);
    this.top30= _.take(sorted, 30);
  }

  onHeaderClick(criteria:string):void{
    console.log(criteria);

    if(this.sortBy === criteria) {
      this.asc_desc = (this.asc_desc === 'asc')?'desc':'asc';
    }

    this.sortBy = criteria;
    this.sortData();
  }

}
