import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';

import {VOOrder} from '../../../amodels/app-models';
import {ApisPrivateService} from '../api-private/apis-private.service';
import {FollowOpenOrder} from './follow-open-order';
import {VOCandle} from '../../../amodels/api-models';
import {CandlesService} from '../../app-services/candles/candles.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import {ApisPublicService} from '../api-public/apis-public.service';
import * as _ from 'lodash';
import {MarketBot} from '../../app-services/app-bots-services/market-bot';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BtcUsdtService} from '../../app-services/alerts/btc-usdt.service';

@Injectable()
export class FollowOrdersService {
  excchanges: string[] = ['binance'];
  excludes: string[] = ['BTC', 'USDT', 'USD'];

  botsSub: BehaviorSubject<MarketBot[]> = new BehaviorSubject<any[]>([]);
  followingOrdersSub: BehaviorSubject<FollowOpenOrder[]> = new BehaviorSubject<FollowOpenOrder[]>([]);
  // following: { [index: string]: FollowOpenOrder } = {};


  // openOrders: {exchange: string, market: string};

  constructor(
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private apisPublic: ApisPublicService,
    private marketCap: ApiMarketCapService,
    private canlesService: CandlesService,
    private btcusdtService: BtcUsdtService
  ) {

  }

  stopFollow(exchange: string, market: string) {
    const following: FollowOpenOrder[] = this.followingOrdersSub.getValue();
    const my = _.find(following, {exchange: exchange, market: market});
    if (!my) throw new Error(exchange + market);
    my.destroy();
    const newFollowing = _.reject(following, {exchange: exchange, market: market});
    if (following.length === newFollowing.length) throw new Error(exchange + market);
    this.followingOrdersSub.next(newFollowing);
    this.excludes.push(market.split('_')[1]);
  }

  bots$() {
    return this.botsSub.asObservable();
  }

  async getBots() {
    return Promise.resolve(this.botsSub.getValue());
  }

  async deleteBot(market: string) {
    let bots = this.botsSub.getValue();
    const exist = _.find(bots, {market: market});
    if (!exist) return;
    console.log(exist);
    if(exist.destroy()) {
      bots = _.reject(bots, {market: market});
      return this.saveBots(bots);
    } return Promise.reject(' cant be destroyed yet');
  }

  async saveBots(bots: MarketBot[]) {
    this.botsSub.next(bots);
    const tosave = bots.map(function (item) {
      return {
        exchange: item.exchange,
        market: item.market,
        reason: item.reason,
        amountCoinUS: item.amountCoinUS,
        isLive: item.isLive
      };
    });
    return this.storage.upsert('bots', tosave);
  }

  async createBot(exchange: string, market: string, reason: string, isLive = false) {
    const bots = this.botsSub.getValue();
    const excist = _.find(bots, {market: market});
    if (excist) {
      excist.reason = reason;
      this.saveBots(bots);
      return;
    }
    bots.push(
      new MarketBot(
        exchange,
        market,
        reason,
        100,
        isLive,
        this.storage,
        this.apisPrivate.getExchangeApi('binance'),
        this.apisPublic.getExchangeApi('binance'),
        this.canlesService,
        this.marketCap,
        this.btcusdtService
      )
    );
    return this.saveBots(bots);
  }

  async initBots() {
    const bots = ((await this.storage.select('bots')) || []).map((item) => {
      return new MarketBot(
        item.exchange,
        item.market,
        item.reason,
        item.amountCoinUS,
        item.isLive,
        this.storage,
        this.apisPrivate.getExchangeApi('binance'),
        this.apisPublic.getExchangeApi('binance'),
        this.canlesService,
        this.marketCap,
        this.btcusdtService
      );
    });
    this.botsSub.next(bots);
  }


  follow(exchange: string) {

    // this.apisPrivate.getExchangeApi(exchange).refreshBalances();
    FollowOpenOrder.status.subscribe(status => {
      console.log('%c ' + status, 'color:green');
    });


    //////  this.apisPrivate.getExchangeApi(exchange).startRefreshBalances();
    /// this.apisPrivate.getExchangeApi(exchange).refreshAllOpenOrders();
   /* this.apisPrivate.getExchangeApi(exchange).balances$().subscribe(balances => {
      if (!balances) return;

      //   const botsMarkets = _.map(this.botsSub.getValue(), 'market');
      /// console.log('balances.length   ' + balances.length);
      this.marketCap.getTicker().then(MC => {

        const ar = this.followingOrdersSub.getValue();

        const excludes = this.excludes;

        balances.forEach((o) => {
          if (excludes.indexOf(o.symbol) === -1) {
            const price = MC[o.symbol] ? MC[o.symbol].price_usd : 0.1;

            const balance = (o.pending + o.available);

            // if(balance) console.log(o.symbol + ' ' +balance + ' '+ price);

            if (balance * price > 10) {
              const market = 'BTC_' + o.symbol;

              if (!_.find(ar, {market: market})) {
                const follow = new FollowOpenOrder(
                  exchange,
                  market,
                  balance,
                  -2,
                  this.marketCap,
                  this.apisPrivate,
                  this.apisPublic,
                  this.storage,
                  this.canlesService
                );
                follow.onEnd = () => {
                  const ar2: FollowOpenOrder[] = _.reject(this.followingOrdersSub.getValue(), {market: follow.market});
                  this.followingOrdersSub.next(ar2);
                  //  follow.destroy();
                };
                ar.push(follow);
              }
            }
          }
        });
        this.followingOrdersSub.next(ar);

      });
    });*/
  }

}
