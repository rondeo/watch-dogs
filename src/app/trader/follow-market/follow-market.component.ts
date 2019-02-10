import { Component, OnInit } from '@angular/core';
import {FollowOrdersService} from '../../adal/apis/open-orders/follow-orders.service';
import {MarketBot} from '../../adal/app-services/app-bots-services/market-bot';
import {ApiMarketCapService} from '../../adal/apis/api-market-cap.service';
import {ApisPublicService} from '../../adal/apis/api-public/apis-public.service';
import {CandlesService} from '../../adal/app-services/candles/candles.service';
import {VOCandle} from '../../amodels/api-models';
import * as _ from 'lodash';
import {TestCandlesService} from '../../test/test-candles.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/internal/Subscription';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-follow-market',
  templateUrl: './follow-market.component.html',
  styleUrls: ['./follow-market.component.css']
})
export class FollowMarketComponent implements OnInit {
  bots$: Observable<any[]>;

  market: string;
  exchange: string;
  reason:string;

  testbot: MarketBot;
  constructor(

    private rote: ActivatedRoute,
    private router: Router,
    private apisPublic: ApisPublicService,
    private followOrder: FollowOrdersService,
    private marketCap: ApiMarketCapService,
    private candelsService: CandlesService,
    private testCandles: TestCandlesService
  ) { }



 async onCreateClick() {
    if(!this.exchange || !this.market || !this.reason) return;
    this.followOrder.createBot(this.exchange, this.market, this.reason);
  }

  mapBots(bots: MarketBot[]){
    return bots.map(function (item) {
      return {
        exchange: item.exchange,
        market: item.market,
        reason: item.reason,
        x: 'X'
      };
    })
  }

  ngOnInit() {
    this.rote.params.subscribe(params => {
      this.market = params.market;
      this.exchange = params.exchange;
      if(this.market === 'null' || this.market === 'undefined') this.market = null;
      if(this.exchange === 'null' || this.exchange === 'undefined') this.exchange = null;
    });

    this.bots$ = this.followOrder.bots$()
      .pipe(
        map(this.mapBots)
      );
  }

  onMarketSelected(evt) {
    const market: string = evt.item.market;
    const exchange = evt.item.exchange;
    switch (evt.prop) {
      case 'market':
        this.router.navigate(['/trader/follow-market', {market, exchange}]);
        break;
      case 'x':
        if (confirm('DELETE ' + market)) {
          this.followOrder.deleteBot(market);
        }
        break;
    }
  }


}
