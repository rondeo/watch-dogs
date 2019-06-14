import {debounceTime, filter, map} from 'rxjs/operators';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {Observable} from 'rxjs/internal/Observable';
import {VOBalance, VOOrder, VOWatchdog, WDType} from '../../amodels/app-models';
import {BotBus} from '../bot-bus';

export const transferToSLState = (bus: BotBus) => {
  return combineLatest(
    bus.wdType$,
    bus.stopLossOrders$ //.pipe(filter(stopLossOrdres => stopLossOrdres.length !== 0))
  ).pipe(filter(([wdType, stopLossOrdres]) => !bus.isDirty && wdType === WDType.LONG && stopLossOrdres.length !== 0))
}

export function selectSellOrdersForLong (bus: BotBus): Observable<VOOrder[]> {
  return combineLatest(
    bus.wdType$,
    bus.sellOrders$
  ).pipe(
    filter(([wdType, sellOrders]) => !bus.isDirty && wdType === WDType.LONG && sellOrders.length !== 0),
    map(([wdType, sellOrdres]) => sellOrdres)
  )
}

export const setStopLossAuto = (bus: BotBus) => {
  return combineLatest(
    bus.wdType$,
    bus.potsDelta$
  ).pipe(
    debounceTime(10),
    filter(([wdType, delta]) => {
    return !bus.isDirty && wdType === WDType.LONG && delta > 0.5;
  }))
}

export const buyingForLong = (bus: BotBus) => {
  return combineLatest(
    bus.wdType$,
    bus.buyOrders$
  ).pipe(filter(([wdType, orders]) => !bus.isDirty && (wdType === WDType.LONG || wdType === WDType.LONG_SL) && orders.length !== 0))
}

export function buyForLong  (bus: BotBus): Observable<{amountCoin: number, buyOrders: VOOrder[]}>{
  return combineLatest(
    bus.wdType$,
    bus.potsDelta$,
    bus.buyOrders$
  ).pipe(
    filter(([wdType, potsDelta, buyOrders]) => {
      return !bus.isDirty &&  (wdType === WDType.LONG || wdType === WDType.LONG_SL) && potsDelta < 0.8 && buyOrders.length === 0;
    }),
    map(([state, delta, buyOrders]) => {
      const config = bus.config$.getValue();
      const potsNeed = config.pots - delta;
      const amountCoin =  potsNeed * config.potSize;
      return {amountCoin, buyOrders}; //
    })
  )
}


export function sellForLong(bus: BotBus): Observable<{amountCoin: number, orders: VOOrder[]}> {
  return combineLatest(
    bus.wdType$,
    bus.potsDelta$,
    bus.ordersOpen$
  ).pipe(
    filter(([wdType, potsDelta, orders]) => {
      orders = orders.filter(function (item) {
       return  item.type !== 'STOP_LOSS_LIMIT';
      });
      console.log(wdType, potsDelta, orders);
      return !bus.isDirty && (wdType === WDType.LONG || wdType === WDType.LONG_SL) && potsDelta > 1.2 && orders.length === 0;
    }),
    map(([state, delta, orders]) => {
      const config = bus.config$.getValue();
      console.log(delta);
      const potsNeed = config.pots - (delta * config.pots);

      const amountCoin =  potsNeed * config.potSize;
      return {amountCoin, orders}; //
    })
  )

}



export const selectStopPrices = (orders: VOOrder[]) => {
  if (!orders) return 0;
  const stopLosses = orders.filter(function (item) {
    return item.stopPrice
  });
  return stopLosses.length ? stopLosses[0].stopPrice : 0;
};

export const selectBuyPrices = (orders: VOOrder[]) => {
  if (!orders) return [0];
  orders = orders.filter(function (item) {
    return item.action === 'BUY'
  });
  return orders.map(function (item) {
    return item.rate
  });
};

export const selectBalanceDifference = (balanceCoin$: Observable<VOBalance>, config$: Observable<VOWatchdog>) =>
  combineLatest(balanceCoin$, config$).pipe(map(([balanceCoin, config]) => {
    const potsBalance = balanceCoin.balance / config.potSize;
    const potsNeed = config.pots;
    const diff = potsNeed - potsBalance;
    return Math.abs(diff) < config.potSize / 3 ? diff * config.potSize : 0;
  }));


export const potsDifference = (potsBalance$: Observable<number>, config$: Observable<VOWatchdog>) =>
  combineLatest(potsBalance$, config$).pipe(map(([potsBalance, config]) => {
    const potsNeed = config.pots;
    const diff = potsNeed - potsBalance;
    return Math.abs(diff) > 0.3 ? diff : 0;
  }));


export function selectPotsBuying(openOrders: VOOrder[], potSize: number): number {
  const buyOrders = openOrders.filter(function (item) {
    return item.action === 'BUY'
  });

  if (buyOrders.length === 0) return 0;

  return buyOrders.reduce(function (s, item) {
    return s += item.amountCoin
  }, 0) / potSize;

}
