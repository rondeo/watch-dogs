import {VOBubble, VOTradesStats} from "../../services/utils-order";
import {VOOrder} from "../../models/app-models";


export class TradesReport {
  bubbles:VOBubble[];
  stats:VOTradesStats[];

  constructor(public exchange:string, public base:string, public coin:string){

  }

  addTrades(trades:VOOrder[]){

  }

}
