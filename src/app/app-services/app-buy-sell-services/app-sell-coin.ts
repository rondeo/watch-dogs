import {ApisPrivateService} from '../../apis/apis-private.service';
import {ApisPublicService} from '../../apis/apis-public.service';
import {StorageService} from '../../services/app-storage.service';
import {VOWatchdog} from '../../models/app-models';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubjectMy} from '../../com/behavior-subject-my';

export class AppSellCoin {
  sellCoins: VOWatchdog[]
  constructor(
    private storage: StorageService,
    private apiPrivate: ApisPrivateService,
    private apiPublic: ApisPublicService,
    private watchDogsSub: BehaviorSubjectMy<VOWatchdog[]>
  ) {

   /* this.sellCoins$().subscribe(res => {
      this.sellCoins = res;
    });*/
  }

  sellCoins$() {
    return this.watchDogsSub.asObservable().map(wds => _.filter(wds, {action: 'SELL'}));
  }

  sellCoinsNumber():Observable<number>{
    return this.sellCoins$().map(wds => wds.length);
  }

}
