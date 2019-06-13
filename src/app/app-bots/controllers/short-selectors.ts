import {BotBus} from '../bot-bus';
import {filter, map} from 'rxjs/operators';
import {VOOrder, WDType} from '../../amodels/app-models';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Observable} from 'rxjs/internal/Observable';

export const selectShort = filter((ar) => ar[0] === WDType.SHORT);

export function cancelStopLossOnShort(bus: BotBus): Observable<VOOrder[]> {
 return  combineLatest(
    bus.wdType$,
    bus.stopLossOrders$
  ).pipe(
    selectShort,
    filter(([wdType, stopLosses]) => stopLosses.length !== 0),
    map(([wdType, stopLosses]) => stopLosses)
  );
}



export function waitForSelling (bus: BotBus): Observable<VOOrder[]> {
  return combineLatest(
    bus.wdType$,
    bus.potsBalance$,
    bus.sellOrders$
  ).pipe(
    selectShort,
    filter(([wdType, postBalance, sellOrdres]) => postBalance > 0.3 && sellOrdres.length !== 0),
    map(([wdType, postBalance, sellOrdres]) => sellOrdres)
  );

}

export function cancelBuysForShort(bus: BotBus): Observable<VOOrder[]> {
 return  combineLatest(
    bus.wdType$,
    bus.potsBalance$,
    bus.buyOrders$
  ).pipe(
    selectShort,
    filter(([wdType, postBalance, orders]) => postBalance > 0.3 && orders.length !== 0),
    map(([wdType, postBalance, ordres]) => ordres)
  );
}

export function needSellOrder(bus: BotBus): Observable<number> {
  return  combineLatest(
    bus.wdType$,
    bus.balanceCoin$,
    bus.ordersOpen$
  ).pipe(
    selectShort,
    filter(([wdType, balanceCoin, orders]) => {
      return balanceCoin.available !==0 && orders.length === 0
    }),
    map(([wdType, balanceCoin, ordres]) => {
      return balanceCoin.available
    })
  );
}

export function shortIsReady(bus: BotBus): Observable<number> {
  return  combineLatest(
    bus.wdType$,
    bus.balanceCoin$,
    bus.ordersOpen$
  ).pipe(
    selectShort,
    filter(([wdType, balanceCoin, orders]) => balanceCoin.balance ===0 && orders.length === 0),
    map(([wdType, balanceCoin, ordres]) => {
      const config = bus.config$.getValue();
      return config.pots * config.potSize
    })
  );
}
