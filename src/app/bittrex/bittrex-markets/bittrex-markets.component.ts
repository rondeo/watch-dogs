import { Component, OnInit } from '@angular/core';
import {BittrexPrivateService} from '../bittrex-private.service';
import {ActivatedRoute} from '@angular/router';
import * as _ from 'lodash';
import {VOMarket} from '../../models/app-models';
import {BittrexService} from '../../exchanges/services/bittrex.service';

@Component({
  selector: 'app-bittrex-markets',
  templateUrl: './bittrex-markets.component.html',
  styleUrls: ['./bittrex-markets.component.css']
})
export class BittrexMarketsComponent implements OnInit {

  coin:string;
  requestedMarketsTitle:string;
  markets:VOMarket[];

  constructor(
    private bitrexService:BittrexPrivateService,
    private bittrexPublic:BittrexService,
    private route:ActivatedRoute

  ) { }

  ngOnInit() {

    let symbols = this.route.snapshot.paramMap.get('symbols');

    if(!symbols) {
      console.error(' no symbols')
      return;
    }

    let coins:string[] = symbols.split(',');


   let sub =  this.bittrexPublic.searchCoinsMarkets(coins).subscribe(res=>{
      console.warn(res);
      this.markets = res;
      if(sub) sub.unsubscribe();
    });

   /* if(pairs){
      this.requestedMarketsTitle = pairs;
      this.coin = '';*/

     /* this.bittrexPublic.getMarketsSummary(pairs.split(','))
        .subscribe(res=>{
         // console.log(res);
          this.requestedMarkets = res;
        })
    } else if(coin){
      this.coin = coin;
      this.bittrexPublic.searchCoinMarkets(coin)//.subscribe(res=> {*/
      /*  console.log(res);
        let ar  = _.map(res, 'pair');
        if(ar.length == 0){
          console.error(' no market for '+coin)
          this.requestedMarkets = [];
          return;
        }
        this.requestedMarketsTitle = ar.toString();

        /!*this.bittrexPublic.getMarketsSummary(ar)
          .subscribe(res=>{
            // console.log(res);
            this.requestedMarkets = res;
          })*!/*/
     // });
   //}




    //console.log(pairs);
   // console.log(pairs);


  }




}
