import {CandlesService} from '../candles/candles.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {BuySellState} from './models';

export class MfiSignal{
  _state: BehaviorSubject<BuySellState> = new BehaviorSubject(BuySellState.NONE);
  constructor(market: string, candlesService: CandlesService) {
    candlesService.candles15min$(market).subscribe(candles =>{


    })
  }
}