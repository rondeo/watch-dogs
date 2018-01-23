import {AutoTransfer} from "./my-bot";
import {VOMarket, VOMarketCap, VOOrder} from "../models/app-models";
import * as _ from 'lodash';

export class Utils{


  static parseTrigger(trigger:AutoTransfer, mc:VOMarketCap):string[]{

    if(!trigger.percent_change_1h && !trigger.percent_change_24h && !trigger.percent_change_7d) return [];

    let messages = [];
    if (trigger.percent_change_1h) {
      if(!Utils.isTrue(mc.percent_change_1h, trigger.percent_change_1h, trigger.percent_change_1hLess)) {
        console.log('false 1h', mc.percent_change_1h, trigger.percent_change_1h, trigger.percent_change_1hLess);
        return [];
      }else messages.push('1 1h MC '+mc.percent_change_1h +(trigger.percent_change_1hLess?' < ':' > ') + trigger.percent_change_1h);

    }
    if (trigger.percent_change_24h) {
      if(!Utils.isTrue(mc.percent_change_24h, trigger.percent_change_24h, trigger.percent_change_24hLess)){
        console.log('false 24h', mc.percent_change_24h, trigger.percent_change_24h, trigger.percent_change_24hLess);
        return [];
      }else messages.push('2 24h MC '+mc.percent_change_24h +(trigger.percent_change_24hLess?' < ':' > ') + trigger.percent_change_24h);

    }

    if (trigger.percent_change_7d) {
      if(!Utils.isTrue(mc.percent_change_7d, trigger.percent_change_7d, trigger.percent_change_7dLess)){
        console.log('false 7d ', mc.percent_change_7d, trigger.percent_change_7d, trigger.percent_change_7dLess);
        return [];
      }else messages.push('3 7d MC '+mc.percent_change_7d +(trigger.percent_change_7dLess?' < ':' > ') + trigger.percent_change_7d);

    }

    return messages;
  }

  static isTrue(a, b, isLess:boolean){
    return isLess ? a < b:a > b;
  }


  static filterTriggers(triggers:AutoTransfer[], mcData, balanceCoinUS ):AutoTransfer[]{

    let results:AutoTransfer[] = []
    for (let i = 0; i < triggers.length; i++) {

      let transafer = triggers[i];
      let coin = transafer.coin;
      let mc = mcData[coin];

      if(transafer.action ==='Buy' && balanceCoinUS > 10){
        console.log(' already have balance 10 < '+ balanceCoinUS);
        continue;
      }else if(transafer.action === 'Sell' && balanceCoinUS < 10) {
        console.log(' already no balance 10 > '+balanceCoinUS);
        continue;
      }

      transafer.triggered = Utils.parseTrigger(transafer, mc);

      if (transafer.triggered.length) results.push(transafer);
    }

    return results;
  }

}