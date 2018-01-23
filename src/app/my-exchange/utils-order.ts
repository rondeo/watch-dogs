import {VOOrder} from "../models/app-models";
import * as _ from 'lodash';


export class UtilsOrder{
  static takeAvarage(oredrs:VOOrder[], prev:number):number{
    if(oredrs.length === 0) return prev;
    let res = {S: 0, Q: 0};

    oredrs.forEach(function (item) {
      this.r.S += item.amountBase * item.rate;
      this.r.Q += item.amountBase;
    }, {r:res});

    return res.S/res.Q;
  }

  static makeLine(value:number, length:number):number[]{
    let out =[]
    while (length--) out.push(value);
    return out;
  }

  static createCharts(history:VOOrder[]):{bought:number[], sold:number[]}{

    let start = history[0].timestamp;
    let end = history[history.length -1].timestamp;

   // let step = (end - start) /10;

    //let nextTime  = start + step;

    let step = (start - end) /10;

    let nextTime  = start - step;
    //let nextTimeB  = start + step;

    let timestamps = [];
    let buys = [];
    let sells = [];
    //let i = 1;
    let groupS:VOOrder[] = [];
    let groupB:VOOrder[] = [];

    let avgB:number;
    let avgS:number;

    console.warn(nextTime);

    history.forEach(function (item, i) {
      if(item.timestamp > nextTime) {
        if(item.action === 'BUY') groupB.push(item);
        else if(item.action === 'SELL') groupS.push(item);
        else console.warn(item);
      }else{
        // console.log(i + ' go next ' + item.timestamp + '  nextTime '+ nextTime);

        timestamps.push(nextTime);
        avgB = UtilsOrder.takeAvarage(groupB, avgB);

        buys.push(avgB);

        avgS = UtilsOrder.takeAvarage(groupS, avgS);

        sells.push(avgS);
        groupB = [];
        groupS = [];
        nextTime -=step
      }
      /* timestamps.push(item.timestamp);
       if(item.action === 'buy') buys.push(item);
       else if(item.action === 'sell') sells.push(item);
       else console.warn(item);*/
    });


    return{
      bought:buys,
      sold:sells
    }
  }


}

