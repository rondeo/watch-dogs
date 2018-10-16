import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../apis-private.service';
import {FollowOpenOrder} from './follow-open-order';
import {VOCandle} from '../../models/api-models';
import {CandlesService} from '../../app-services/candles/candles.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import {ApisPublicService} from '../apis-public.service';
import * as _ from 'lodash';

@Injectable()
export class OpenOrdersService {
  excchanges: string[] = ['binance'];

  followingOrdersSub: BehaviorSubject<FollowOpenOrder[]> = new BehaviorSubject<FollowOpenOrder[]>([]);
  following: { [index: string]: FollowOpenOrder } = {};


  // openOrders: {exchange: string, market: string};

  constructor(
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private canlesService: CandlesService
  ) {


  }

  follow(exchange: string) {
    // this.apisPrivate.getExchangeApi(exchange).refreshBalances();
    this.apisPrivate.getExchangeApi(exchange).startRefreshBalances();
    this.apisPrivate.getExchangeApi(exchange).balances$().subscribe(balances => {

      if (!balances) return;
      this.marketCap.getTicker().then(MC => {
        const ar = this.followingOrdersSub.getValue();
        balances.forEach((o) => {
          if (o.symbol !== 'BTC' && o.symbol !== 'USDT') {
            const price = MC[o.symbol] ? MC[o.symbol].price_usd : 0.1;

            if ((o.pending + o.available) * price > 10) {
              const market = 'BTC_' + o.symbol;
              if (!_.find(ar, {market: market})) {
                const follow = new FollowOpenOrder(exchange, market, -2, this.apisPrivate, this.apisPublic, this.marketCap, this.canlesService);
                follow.onNoBalance = () => {
                  const ar2: FollowOpenOrder[]  = _.reject(this.followingOrdersSub.getValue(), {market: follow.market});
                  this.followingOrdersSub.next(ar2);
                  follow.destroy();
                }
                ar.push(follow);
              }
            }
          }
        });
        this.followingOrdersSub.next(ar);
      });

     //  console.log(balances);


      /*orders.forEach((order: VOOrder) => {
        const market = order.base + '_' + order.coin;
        const id = order.exchange + '-' + market;
        if (!this.following[id]) {
          const follow = new FollowOpenOrder(exchange, market, -2, this.apisPrivate, this.apisPublic, this.marketCap);
          const data = this.followingOrdersSub.getValue();
          data.push(follow);
          this.following[id] = follow;
          this.followingOrdersSub.next(data);

        }
      });*/
    })
  }

}
