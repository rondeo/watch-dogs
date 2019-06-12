import {VOOrder} from '../../amodels/app-models';
import {ApiPrivateAbstaract} from '../../a-core/apis/api-private/api-private-abstaract';
import {Subject} from 'rxjs/internal/Subject';
import {UTILS} from '../../acom/utils';

export function cancelOrders(ordres: VOOrder[], api: ApiPrivateAbstaract, sub: Subject<string> = new Subject()) {

  const next = ordres.shift();
  if(!next) {
    api.refreshAllOpenOrders();
    UTILS.wait(5).then(() => {
      sub.complete();
    });
    return
  }

  api.cancelOrder2(next.uuid, next.market).subscribe(res => {
    sub.next(res.uuid);
    UTILS.wait(5).then(() => {
      cancelOrders(ordres, api);
    })
  }, err => {
    UTILS.wait(10).then(() => {
      cancelOrders(ordres, api, sub);
    })
  })

  return sub;
}


