import {Injectable} from '@angular/core';
import {StorageService} from '../../services/app-storage.service';
import {VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AppSellCoin} from './app-sell-coin';

@Injectable()
export class AppBuySellService {

  private watchDogsDataSub: BehaviorSubject<VOWatchdog[]> = new BehaviorSubject(null);

  private sellCoinsCtr: AppSellCoin;

  constructor(
    private storage: StorageService
  ) {
    this.storage.getWatchDogs().then(wd => this.watchDogsDataSub.next(wd))
  }

  startSellCoins() {

  }

  watchdogsData$() {
    return this.watchDogsDataSub.asObservable();
  }

  deleteWatchDog(wd: VOWatchdog) {

    let allDogs = this.watchDogsDataSub.getValue();

    allDogs = allDogs.filter(function (item) {
      return item.id && item.id !== wd.id;
    });

    this.storage.saveWatchDogs(allDogs).then(res => this.watchDogsDataSub.next(allDogs));

  }

}
