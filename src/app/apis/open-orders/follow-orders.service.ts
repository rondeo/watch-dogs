import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';

import {VOOrder} from '../../models/app-models';
import {ApisPrivateService} from '../api-private/apis-private.service';
import {FollowOpenOrder} from './follow-open-order';
import {VOCandle} from '../../models/api-models';
import {CandlesService} from '../../app-services/candles/candles.service';
import {ApiMarketCapService} from '../api-market-cap.service';
import {ApisPublicService} from '../api-public/apis-public.service';
import * as _ from 'lodash';
import {MarketBot} from '../../app-services/app-bots-services/market-bot';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

@Injectable()
export class FollowOrdersService {
  excchanges: string[] = ['binance'];
  excludes:string[] = ['BTC','USDT'];

  botsSub : BehaviorSubject< MarketBot[] > = new BehaviorSubject<any[]>([]);
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

  async getBots(){
    return Promise.resolve(this.botsSub.getValue());
  }
  async deleteBot(market: string){
    let bots = this.botsSub.getValue();
    const exist = _.find(bots, {market:market});
    if(!exist)  return;
      exist.destroy();
    bots = _.reject(bots, {market:market});
    return this.saveBots(bots);
  }
 async saveBots(bots){
    this.botsSub.next(bots);
    bots = bots.map(function (item) {
      return {
        market:item.market,
        amountCoin: item.amountCoin,
        history: item.history
      }
    })
   return this.storage.upsert('bots', bots);
  }

  async createBot(market:string, amountCoin:number){
    const bots = this.botsSub.getValue();
    const excist = _.find(bots, {market:market});
    if(excist) throw new Error(' market bot exist');
    bots.push(
      new MarketBot(
        'binance',
        market,
        amountCoin,
        this.storage,
        this.apisPrivate.getExchangeApi('binance'),
        this.apisPublic.getExchangeApi('binance'),
        this.canlesService
      )
    );
    return this.saveBots(bots);
  }
  async initBots(){
    const bots = ((await this.storage.select('bots')) || []).map((item)=>{
      return new MarketBot(
        'binance',
        item.market,
        item.amountCoin,
        this.storage,
        this.apisPrivate.getExchangeApi('binance'),
        this.apisPublic.getExchangeApi('binance'),
        this.canlesService
      )
    });
    this.botsSub.next(bots);
  }


  follow(exchange: string) {

    // this.apisPrivate.getExchangeApi(exchange).refreshBalances();
    FollowOpenOrder.status.subscribe(status =>{
      console.log('%c ' +status, 'color:green');
    });


    this.apisPrivate.getExchangeApi(exchange).startRefreshBalances();
    this.apisPrivate.getExchangeApi(exchange).refreshAllOpenOrders();
    this.apisPrivate.getExchangeApi(exchange).balances$().subscribe(balances => {
       if (!balances)  return;

      const botsMarkets = _.map(this.botsSub.getValue(), 'market');
     /// console.log('balances.length   ' + balances.length);
      this.marketCap.getTicker().then(MC => {
        const ar = this.followingOrdersSub.getValue();
        const excludes = this.excludes.concat(botsMarkets);

        balances.forEach((o) => {
          if (excludes.indexOf(o.symbol) === -1) {
            const price = MC[o.symbol] ? MC[o.symbol].price_usd : 0.1;

            const balance = (o.pending + o.available);

            //if(balance) console.log(o.symbol + ' ' +balance + ' '+ price);

            if (balance * price > 10) {
              const market = 'BTC_' + o.symbol;

              if (!_.find(ar, {market: market})) {
                const follow = new FollowOpenOrder(
                  exchange,
                  market,
                  balance,
                  -2,
                  this.apisPrivate,
                  this.apisPublic,
                  this.marketCap,
                  this.storage,
                  this.canlesService
                );
                follow.onEnd = () => {
                  const ar2: FollowOpenOrder[]  = _.reject(this.followingOrdersSub.getValue(), {market: follow.market});
                  this.followingOrdersSub.next(ar2);
                 //  follow.destroy();
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
