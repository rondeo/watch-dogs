import {VOOrder} from "../../my-exchange/services/my-models";
import {Observable} from "rxjs/Observable";
import {IApiPublic} from "../../my-exchange/services/apis/api-base";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

export class TradesCollector {


 /* allTradesSub:BehaviorSubject<{exchange:string, base:string, coin:string, trades:VOOrder[]}>;
  allTrades$():Observable<{exchange:string, base:string, coin:string, trades:VOOrder[]}{

    return this.allTradesSub.asObservable();
  }*/

  constructor(base:string, coin:string, private apis:IApiPublic[]){

  }

}
