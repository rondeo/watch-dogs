import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AllCoinsService} from '../all-coins.service';
import {VOMarket} from '../../models/app-models';
import * as _ from 'lodash';
import {StorageService} from '../../services/app-storage.service';

@Component({
  selector: 'app-all-overview',
  templateUrl: './all-overview.component.html',
  styleUrls: ['./all-overview.component.css']
})
export class AllOverviewComponent implements OnInit {


  //currentExchangeData:VOMarket;

  marketsAr:VOMarket[];
  fullDataAr:VOMarket[];
  baseCurrencies:string[];

  isProgress:boolean;
  title:string;



  constructor(
    private route:ActivatedRoute,
    private allService:AllCoinsService,
    private storage:StorageService
  ) { }

  ngOnInit() {

    this.selected = this.storage.getSelectedMC();
    this.allService.currentMarketsAr$.subscribe(res=>{
      //console.log(res);
      if(!res) return;


      this.isProgress = false;
      this.title = this.allService.currentExchange.config.name;

      this.fullDataAr  = _.sortBy(res, 'pair');


     // this.baseCurrencies =[];

      this.baseCurrencies = this.allService.baseCurrensies;

      if(!this.unchecked) this.unchecked = []//= this.baseCurrencies.slice(0);


      this.filterArr();

      if(this.allService.isComplex()){

        this.allService.loadDetails(this.marketsAr);
      };
    })

    this.route.params.subscribe(params=>{
      console.log(params);
      this.isProgress = true;
      this.allService.setCurrentExchangeById(params.exchange);



     /* this.allService.getAllExchanges().subscribe(all=>{
        if(!all) return;

        console.log(all);


      })*/

    })

  }


  selected:string[];

  onSelectedChange(evt){

   if(evt.checked){
     this.selected = this.storage.getSelectedMC();
   }else this.selected = null;

   this.filterArr();

  }

  onMarketClick(market){
    console.log(market);
   let url:string =  this.allService.getMarketUrl(market);
   console.log(url);
   window.open(url,'_blank');
  }
  onChartClick(market){

  }


  private filterArr(){

    let unchecked:string[]  = this.unchecked;

     let out =  this.fullDataAr.filter(function (item) {
      return this.ar.indexOf(item.base) ===-1;
    },{ar:unchecked});

    if(this.selected){
      out = out.filter(function (item) {
        return this.sel.indexOf(item.coin) !==-1;
      },{sel:this.selected})
    }

    this.marketsAr = out;
  }




  unchecked:string[];
  onChangeBase(evt, currency){

    if(!evt.checked){

      if(this.unchecked.indexOf(currency) ===-1) this.unchecked.push(currency);

    }
    else this.unchecked.splice(this.unchecked.indexOf(currency),1);
   this.filterArr();


  }

}
