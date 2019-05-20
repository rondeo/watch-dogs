import { Injectable } from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {StorageService} from '../../a-core/services/app-storage.service';
import {Observable} from 'rxjs/internal/Observable';
import {
  AppBotsActions,
  AppBotsActionTypes,
  AppBotsLoaded,
  AppBotsOnBalances,
  AppBotsOnOpenOrders,
  AppBotsOnServerData
} from '../actions/app-bots.actions';
import {concatMap, map, switchMap, timeout} from 'rxjs/operators';
import {fromPromise} from 'rxjs/internal-compatibility';
import {MarketBot} from '../market-bot';
import {VOBalance, VOWatchdog} from '../../amodels/app-models';
import {ApisPrivateService} from '../../a-core/apis/api-private/apis-private.service';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {ApiPublicAbstract} from '../../a-core/apis/api-public/api-public-abstract';
import {CandlesService} from '../../a-core/app-services/candles/candles.service';
import {ApiMarketCapService} from '../../a-core/apis/api-market-cap.service';
import {BtcUsdtService} from '../../a-core/app-services/alerts/btc-usdt.service';
import {ApisPublicService} from '../../a-core/apis/api-public/apis-public.service';

import {AppState} from '../../app-store/reducers';
import {Store} from '@ngrx/store';
import {concat} from 'rxjs';
import {merge} from 'rxjs';


const downloadBalances = (api) => api.downloadBalances().pipe(map(balances => balances ));


@Injectable()
export class AppBotsEffects {

  exchange = 'binance';

  constructor(
    private actions$: Actions,
    private storage: StorageService,
    private apisPrivate: ApisPrivateService,
    private store: Store<AppState>
  ) {}

  @Effect()
  loadBots$: Observable<AppBotsActions> = this.actions$.pipe(
    ofType(AppBotsActionTypes.LoadAppBots),
    switchMap(() => {
      return fromPromise(this.storage.select('bots')).pipe(map((dogs: VOWatchdog[]) => {
       const bots: any[] = dogs.map( (item) => {
          return item
        });
        return new AppBotsLoaded(bots)
      }))
    })
  )


  @Effect()
  downloadBalances$: Observable<AppBotsActions> = this.actions$.pipe(
    ofType(AppBotsActionTypes.DownloadBalances),
    switchMap(() => {
      const api = this.apisPrivate.getExchangeApi(this.exchange);
      return api.downloadBalances().pipe(map(balances => {
       //  console.log(balances);
       return balances;
      }), switchMap((balances) =>{
        return api.downloadAllOpenOrders().pipe(map(openOrders => {
          console.log(balances, openOrders);
          return new AppBotsOnServerData({balances, openOrders})
        }))
      }))
    })
  )

}
