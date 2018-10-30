import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../api-private/apis-private.service';
import {FollowOpenOrder} from './follow-open-order';
import {VOCandle} from '../../models/api-models';
import {CandlesService} from '../../app-services/candles/candles.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import {ApisPublicService} from '../api-public/apis-public.service';
import * as _ from 'lodash';

@Injectable()
export class FollowOrdersService {
  excchanges: string[] = ['binance'];

  excludes:string[] = ['BTC'];

  followingOrdersSub: BehaviorSubject<FollowOpenOrder[]> = new BehaviorSubject<FollowOpenOrder[]>([]);
  // following: { [index: string]: FollowOpenOrder } = {};


  // openOrders: {exchange: string, market: string};

  constructor(
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private canlesService: CandlesService
  ) {

  }
  stopFollow(exchange: string, market: string) {
    const following:  FollowOpenOrder[] = this.followingOrdersSub.getValue();
    const my = _.find(following, {exchange: exchange, market:market});
    if(!my) throw new Error(exchange+market);
    my.destroy();
    const newFollowing = _.reject(following, {exchange: exchange, market:market});
    if(following.length === newFollowing.length) throw new Error(exchange+market);
    this.followingOrdersSub.next(newFollowing);
    this.excludes.push(market.split('_')[1]);
  }

  follow(exchange: string) {
    // this.apisPrivate.getExchangeApi(exchange).refreshBalances();
    FollowOpenOrder.status.subscribe(status =>{
      console.log('%c ' +status, 'color:green');
    });

    this.apisPrivate.getExchangeApi(exchange).startRefreshBalances();
    this.apisPrivate.getExchangeApi(exchange).refreshAllOpenOrders();
    this.apisPrivate.getExchangeApi(exchange).balances$().subscribe(balances => {
      if (!balances) return;

      this.marketCap.getTicker().then(MC => {
        const ar = this.followingOrdersSub.getValue();
        const excludes = this.excludes;

        balances.forEach((o) => {
          if (o.symbol !== 'BTC' && o.symbol !== 'USDT' && excludes.indexOf(o.symbol) === -1) {
            const price = MC[o.symbol] ? MC[o.symbol].price_usd : 0.1;

            if ((o.pending + o.available) * price > 10) {
              const market = 'BTC_' + o.symbol;
              if (!_.find(ar, {market: market})) {
                const follow = new FollowOpenOrder(
                  exchange,
                  market,
                  -2,
                  this.apisPrivate,
                  this.apisPublic,
                  this.marketCap,
                  this.storage,
                  this.canlesService
                );
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
    })
  }

}
