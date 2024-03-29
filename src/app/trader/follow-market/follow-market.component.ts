import { Component, OnInit } from '@angular/core';
import {FollowOrdersService} from '../../a-core/apis/open-orders/follow-orders.service';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {ApisPublicService} from '../../a-core/apis/api-public/apis-public.service';
import {CandlesService} from '../../a-core/app-services/candles/candles.service';
import {VOCandle} from '../../amodels/api-models';
import * as _ from 'lodash';
import {TestCandlesService} from '../../test/test-candles.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/internal/Subscription';
import {Observable} from 'rxjs/internal/Observable';
import {map} from 'rxjs/operators';
import {OrderType} from '../../amodels/app-models';


@Component({
  selector: 'app-follow-market',
  templateUrl: './follow-market.component.html',
  styleUrls: ['./follow-market.component.css']
})
export class FollowMarketComponent implements OnInit {
  bots$: Observable<any[]>;

  market: string;
  exchange: string;
  reason: OrderType;
  testbot: any;

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

  mapBots(bots: any[]){
    return bots.map(function (item) {
      return {
        exchange: item.exchange,
        market: item.market,
       // reason: item.reason,
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
