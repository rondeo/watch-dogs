import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MarketCapService} from '../services/market-cap.service';
import {VOSymbolMarkets} from '../gl-all-exchanges/gl-all-exchanges.component';
import {Utils} from '../../shared/utils';
import {ActivatedRoute} from '@angular/router';
import * as _ from 'lodash';

@Component({
  selector: 'app-coins-exchanges',
  templateUrl: './coins-exchanges.component.html',
  styleUrls: ['./coins-exchanges.component.css']
})
export class CoinsExchangesComponent implements OnInit, OnChanges {

  @Input() consAr:string[];

 // symbolExchanges:VOExchangeCoin[];

  coinId:string;
//  exchanges:VOExchangeCoin[];

  constructor(
    private route:ActivatedRoute,
    private marketcap:MarketCapService
  ) { }

  ngOnInit() {


    let coinId = this.route.snapshot.paramMap.get('coinId');

    this.coinId = coinId;

    //console.log(coinId);

   /* this.marketcap.getCoinsExchanges().subscribe((res:VOExchangeCoin[])=>{
      this.exchanges = res;
      let ar = res.filter(function (item) {
        return item.coinId  === coinId
      });

      this.symbolExchanges = _.orderBy(ar, 'exchange');
     // this.pricessData();
    })*/
  }


  /*pricessData(){



    let ar:string[] = this.consAr;

    let exchanges:VOExchangeCoin[] = this.exchanges;

    if(!ar || !this.exchanges) return;

    let symbolMarkets:VOSymbolMarkets[] = [];


    ar.forEach(function (item) {

      let symbol = item;

      symbolMarkets.push({
        symbol:symbol,
        markets: Utils.filterMarkets(symbol, exchanges)
      });

    });

    this.symbolMarkets = symbolMarkets;
  }*/

  ngOnChanges(changes: SimpleChanges) {

    console.log(changes);
    // You can also use categoryId.previousValue and
    // categoryId.firstChange for comparing etc.

  }

}
