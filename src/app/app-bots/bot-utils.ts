import {Observable} from 'rxjs/internal/Observable';
import {VOBalance} from '../amodels/app-models';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

export function subscribeBalance(
  base: string,
  coin: string,
  min: number,
  balancesApi$: Observable<VOBalance[]>,
  balanceCoin$: BehaviorSubject<VOBalance>,
  balanceBase$: BehaviorSubject<VOBalance>) {

  return balancesApi$.subscribe(balances => {

    const balanceBaseOld: VOBalance = balanceBase$.getValue();
    const balanceCoinOld: VOBalance = balanceCoin$.getValue();
    const balanceBase = balances.find(function (item) {
      return item.symbol === base;
    });
    const balanceCoin = balances.find(function (item) {
      return item.symbol === coin;
    });

    if (balanceCoin.available < min) balanceCoin.available = 0;
    if (balanceCoin.balance < min) balanceCoin.balance = 0;

    if(!balanceCoinOld)  {
      console.log(' no old balance')
      balanceCoin$.next(balanceCoin);
    }
    else if (balanceCoinOld.available !== balanceCoin.available || balanceCoinOld.pending !== balanceCoin.pending) {
      console.log(balanceCoinOld, balanceCoin);
      balanceCoin$.next(balanceCoin);
    }

    balanceBase$.next(balanceBase);

  })


  }
