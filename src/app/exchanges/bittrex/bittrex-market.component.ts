import { Component, OnInit } from '@angular/core';
import {BittrexService} from '../services/bittrex.service';
import * as _ from 'lodash';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {VOMarketCap} from '../../models/app-models';

@Component({
  selector: 'app-bittrex-market',
  templateUrl: './bittrex-market.component.html',
  styleUrls: ['./bittrex-market.component.css']
})

export class BittrexMarketComponent implements OnInit {

  sortBy: string;
  asc_desc: string = 'desc';
  marketsAr: any[];


  constructor(
    private bittrexService:BittrexService,
    private marketCap:MarketCapService
  ) { }

  ngOnInit() {

   // this.marketCap.getAllCoinsData().subscribe(mcap=>{
    //  if(!mcap) return;

      //this.bittrexService.getMarketsAr().subscribe(res=>{
        // console.log(res);

     //   if(!res) return;

       // let indexed = this.bittrexService.markets;

      //  res.forEach(function (item) {
         /* let prec = 2;
          let pairs= item.pair.split('_');
          let  base  = indexed['USDT_'+pairs[0]];
          if(base){
            let price = base.last;
            let prec = (item.last*price)<0.01?4:2;
            item.usd_last = (item.last * price).toFixed(prec);
          }else{
            item.usd_last = item.last.toFixed(2);
            console.log(' no base1 ' + pairs[0]);
          }

          let mc:VOMarketCap = mcap[pairs[1]];

          if(mc){
            item.usd_mcap = mc.price_usd.toFixed(prec);

          }else {
            item.usd_mcap ='0';
            console.log('no marketcap ' + pairs[1]);
          }

          item.delta = ((item.high - item.low)/(item.low+item.high)/2*100).toFixed(2);


          item.is_last_up = item.last>item.prevDay;

          item.delta24 =  ((item.last - item.prevDay)/(item.last+item.prevDay)/2*100).toFixed(2);


        });
*/

      //  this.marketsAr = res

       // this.doSort(res);
       // this.marketModels1 = res;
     // })

   // })
   /* this.bittrexService.getMarkets().subscribe(res=>{
     // console.log(res);
      this.marketModels1 = res;
    })

    this.bittrexService.getCurrencies().subscribe(res=>{
     /// console.log(res);
     // this.marketModels1 = res;
    })*/

  }


 private doSort(ar:any[]){
    if(this.sortBy) this.marketsAr = _.orderBy(ar, this.sortBy, this.asc_desc);
    else this.marketsAr = ar;
  }
  onClickHeader(sortBy:string){
    console.log(sortBy);
    if(this.sortBy === sortBy){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);
    this.sortBy = sortBy;
    if(this.marketsAr) this.doSort(this.marketsAr);
  }

}
