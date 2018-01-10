import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MarketCapService} from '../../market-cap/market-cap.service';
import * as _ from 'lodash';
import {BittrexPrivateService} from '../bittrex-private.service';
import {VOMarket, VOMarketB} from '../../models/app-models';
import {BittrexService} from '../../exchanges/services/bittrex.service';
import {MatSnackBar} from '@angular/material';
import {Router} from "@angular/router";
import {StorageService} from "../../services/app-storage.service";


@Component({
  selector: 'app-bittrex-data',
  templateUrl: './bittrex-data.component.html',
  styleUrls: ['./bittrex-data.component.css']
})
export class BittrexDataComponent implements OnInit, OnDestroy {

  @ViewChild('baseBTC') baseBTC;
  @ViewChild('baseETH') baseETH;
  @ViewChild('baseUSDT') baseUSDT;


  sortBy:string = 'pair';
  asc_desc:string ='asc';

  marketsAr:VOMarket[];
  marketsArAll:VOMarket[];
  isSelectedOnly:boolean = true;

 // marketsAr2:VOMarketB[];
  constructor(
    //private bittrexService:BittrexPrivateService,
    private bittrexPublic:BittrexService,
    private router:Router,
   // private marketCap:MarketCapService,
    private snackBar:MatSnackBar,
    private storage:StorageService
  ) { }

  private sub1;
  ngOnDestroy(){
    this.sub1.unsubscribe();
  }
  ngOnInit() {

    this.sub1 = this.bittrexPublic.getMarketsAr().subscribe(res=>{
      this.marketsArAll = res;
      this.render();
    });

  }

  onPairClick(){

    this.onSortClick('pair');

  }

  onRankClick(){
    this.onSortClick('coinRank');
  }

  render(){
    if(!this.marketsArAll) return;
    console.log('render');

    let ar = this.bittrexPublic.marketsAr.filter(function (item) {
      return this.ar.indexOf(item.base) !==-1;
    },{ar:this.checked});

    if(this.isSelectedOnly){
      ar = ar.filter(function (item) {
        return item.selected;
      });
    }

    this.doSort(ar);

  }
  private checked = ['BTC', 'ETH','USDT' ];
  onChangeBase(){
    let checked:string[] = [];
    if(this.baseBTC.checked)checked.push('BTC');
    if(this.baseETH.checked)checked.push('ETH');
    if(this.baseUSDT.checked)checked.push('USDT');

    this.checked = checked;
    this.render();
   // console.log(this.baseBTC.checked, this.baseETH.checked, this.baseUSDT.checked);
  }



  private doSort(ar:VOMarket[]){
    this.marketsAr = _.orderBy(ar, this.sortBy, this.asc_desc);
  }

  onSortClick(sortBy:string){
    console.log(sortBy);
    if(this.sortBy === sortBy){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);
    this.sortBy = sortBy;
    if(this.marketsAr) this.doSort(this.marketsAr);
  }


  onMarketClick(market:VOMarket){
    let pair = market.pair;

    window.open('https://bittrex.com/Market/Index?MarketName='+pair.replace('_','-'),'_blank');


  }

  onMarketSelected(evt, market:VOMarket){
    console.log(evt);

    //market.selected = evt.checked;

    let selected = this.bittrexPublic.getMarketsSelecetd();
    let ind = selected.indexOf(market.pair);
    if(evt.target.checked) {
      if(ind ===-1) selected.push(market.pair);
      market.selected = true;
    }else {
      if(ind !==-1) selected.splice(ind,1);
    }

    this.bittrexPublic.saveMarketsSelected();

  }
  onChartClick(market:VOMarketB){
    let symbolTo:string = market.MarketName.split('-')[1];

   /*  let mc = this.marketCap.getBySymbol(symbolTo);
     if(!mc){
       this.snackBar.open('No coin ' + symbolTo,'x', {duration:3000});
       return;
     }

     let id = mc.id;
     window.open('https://coinmarketcap.com/currencies/'+id,'_blank');
*/
  }


  onSelectedChckClick(evt){
   // console.log(evt);
   this.isSelectedOnly = evt.checked;
    this.render();
  }


  onRefreshClick(){
    this.bittrexPublic.refershMarkets();
  }

}
