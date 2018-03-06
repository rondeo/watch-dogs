import {VOBubble, VOTradesStats} from "../../my-exchange/utils-order";
import {VOOrder} from "../../my-exchange/services/my-models";

export class TradesReport {
  bubbles:VOBubble[];
  stats:VOTradesStats[];

  constructor(public exchange:string, public base:string, public coin:string){

  }

  addTrades(trades:VOOrder[]){

  }

}
