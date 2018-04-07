import {VOBooks, VOMarket, VOOrder} from "../models/app-models";
import {Observable} from "rxjs/Observable";

export interface IApiPublic {
  downloadBooks(base:string, coin:string):Observable<VOBooks>;
  downloadMarketHistory(base:string, coin:string):Observable<VOOrder[]>;
  downloadTicker():Observable<{[market:string]:VOMarket}>;
}
