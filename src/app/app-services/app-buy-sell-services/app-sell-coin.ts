import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';

export class AppSellCoin {
  private sellCoins: VOWatchdog[];

  private sellCoinsSub: BehaviorSubjectMy<VOWatchdog[]> = new BehaviorSubjectMy(null)

  constructor(
    private storage: StorageService,
    private apiPrivate: ApisPrivateService,
    private apiPublic: ApisPublicService,
    private watchDogsSub: BehaviorSubjectMy<VOWatchdog[]>
  ) {

    watchDogsSub.asObservable().subscribe(wds => {
      this.sellCoins = _.filter(wds, {action: 'SELL'});
      this.sellCoinsSub.next(this.sellCoins);
    });
  }

  sellCoins$() {
    return this.sellCoinsSub.asObservable();

  }

  sellCoinsNumber():Observable<number>{
    return this.sellCoins$().map(wds => wds.length);
  }

  run() {

    console.log(this.sellCoins);
  }
}
