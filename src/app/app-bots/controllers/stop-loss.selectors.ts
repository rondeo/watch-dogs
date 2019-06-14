import {BotBus} from '../bot-bus';
import {combineLatest} from 'rxjs/internal/observable/combineLatest';
import {filter, map} from 'rxjs/operators';
import {WDType} from '../../amodels/app-models';

const selectSL = filter(ar => ar[0] === WDType.LONG_SL);

export function adjustBalance(bus: BotBus) {
  combineLatest(
    bus.wdType$,
    bus.potsDelta$
  ).pipe(
    selectSL,
    filter(([wdType, potsDelta]) => {
      return true;
    })
    ,map(([wdType, potsDelta]) => {
      return potsDelta
    } )
  )
}
