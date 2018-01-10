import { Component, OnInit } from '@angular/core';
import {PoloniexService} from '../services/poloniex.service';
import {VOExchange, VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/market-cap.service';

@Component({
  selector: 'app-poloniex-ticker',
  templateUrl: './poloniex-ticker.component.html',
  styleUrls: ['./poloniex-ticker.component.css']
})
export class PoloniexTickerComponent implements OnInit {

  marketsAr:VOExchange[];

  marketsUS:{[symbol:string]:VOMarketCap};
  constructor(
    private poloniex:PoloniexService,
    private marketCap:MarketCapService
  ) { }

  ngOnInit() {
    this.marketCap.coinsAr$.subscribe(res=>{

    if(!res) return;
      this.marketsUS = this.marketCap.getAllCoinsData();

      this.poloniex.getTicker().subscribe(res =>{
        //console.log(res);
        let mcap = this.marketsUS;
        let indexed = this.poloniex.marketsInd;
        //let btcPrice = this.marketsUS['BTC'].price_usd;

      //  console.log(btcPrice);



        res.forEach(function (item) {
          let prec = 2;
          let pairs= item.pair.split('_');

         // let base:VOExchangeData = mcap[pairs[0]];

          let  base  = indexed['USDT_'+pairs[0]];




          if(base){
            let price1 = base.last;
            let prec = (item.last*price1)<0.01?4:2;

            item.usd_last = (item.last * price1).toFixed(prec);

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


          item.prevDay  =  (item.high24hr+item.low24hr)/2;

          item.is_last_up = item.last>item.prevDay;


          item.delta = ((item.low - item.high)/(item.low+item.high)/2*100).toFixed(2);

          item.delta24 =  ((item.last - item.prevDay)/(item.last+item.prevDay)/2*100).toFixed(2);


          item.percentChange = Math.round(item.percentChange*100)/100;

          /*
                    if(base){
                      let price = base.price_usd;

                     /!* let coin:VOExchangeData = mcap[pairs[1]];
                      if(coin){
                        item.usd_mcap = coin.price_usd.toFixed(prec);

                      }else {
                        item.usd_mcap ='0';
                        console.log('no coin ' + pairs[1]);
                      }
          *!/

                     // item.price_usd_last = item.last*price;



                    }else console.log(' no base for '+pairs[0]);*/

         /* if(item.pair.indexOf('BTC_') ===0) {





            item.display_last = item.price_usd_last.toFixed(prec);

            item.price_usd_low = item.low*btcPrice
            item.display_low = item.price_usd_low.toFixed(prec);
            item.price_usd_high = item.high*btcPrice;
            item.display_high = item.price_usd_high.toFixed(prec);

            item.display_low24 = (item.low24hr*btcPrice).toFixed(prec);
            item.display_high24 = (item.high24hr*btcPrice).toFixed(prec);


          }*/

        })



        this.marketsAr = res
      })
    })

    this.marketCap.refresh();

  }

}


