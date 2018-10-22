import { Injectable } from '@angular/core';
import {VOMarketCap, VOWatchdog} from "../../src/app/models/app-models";
import {StorageService} from "../../src/app/services/app-storage.service";
import * as _ from 'lodash';
import {ApisPrivateService} from "../../src/app/apis/api-private/apis-private.service";
import {VOMCAgregated} from '../../src/app/shared/models';



@Injectable()
export class UsdtBtcService {

  wd:VOWatchdog;
  constructor(
    private storage: StorageService,
    private apisPrivate: ApisPrivateService
  ) {
   this.init();
  }

  async init(){
    const wds: VOWatchdog[] = await this.storage.getWatchDogs();
    this.wd = _.find(wds, {base:'USDT', coin:'BTC'})
  }

  runMC(coinMC:VOMCAgregated){
    if(!this.wd) return;

  /*  const current =coinMC.price_usd;
    const prev = +(100 * (current - coinMC.prev) / coinMC.prev).toFixed(4);
    const prev5 = +(100 * (current - coinMC.prev5) / coinMC.prev5).toFixed(4);

    const prev10 = +(100 * (coinMC.prev5 - coinMC.prev10) / coinMC.prev10).toFixed(4);
    const prev20 = +(100 * (coinMC.prev10 - coinMC.prev20) / coinMC.prev20).toFixed(4);
    const prev30 = +(100 * (coinMC.prev20 - coinMC.prev30) / coinMC.prev30).toFixed(4);
    const ago2h = +(100 * (coinMC.prev10 - coinMC.ago2h) / coinMC.ago2h).toFixed(4);
    const ago3h = +(100 * (coinMC.prev10 - coinMC.ago3h) / coinMC.ago3h).toFixed(4);


    console.log('BTC prev ' + prev + ' prev5 ' + prev5 + ' prev10 ' + prev10 + ' prev20 ' + prev20 + ' prev30 ' + prev30 + ' ago2h ' + ago2h + ' ago3h  ' + ago3h)

*/

  }

}
