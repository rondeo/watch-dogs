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

  static createCharts(history:VOOrder[]):{bought:number[], sold:number[], timestamps:number[]}{

    let start = history[0].timestamp;
    let end = history[history.length -1].timestamp;



   // let step = (end - start) /10;

    //let nextTime  = start + step;

    let step = Math.round((start - end) /10);

    let nextTime  = start - step;
    //let nextTimeB  = start + step;

    let timestamps = [];
    let buys = [];
    let sells = [];
    //let i = 1;
    let groupS:VOOrder[] = [];
    let groupB:VOOrder[] = [];

    let avgB:number =0;
    let avgS:number =0;
//
    //console.warn(Math.round(step/1000))
    //console.warn(nextTime);

    let startTime = new Date(start);
    let nextTimed = new Date(nextTime);
    //console.log(startTime.getMinutes()  + ':'+ startTime.getSeconds())
   // console.log(nextTimed.getMinutes()  + ':'+ nextTimed.getSeconds())


    history.forEach(function (item, i) {
      if(item.timestamp > nextTime) {
        if(item.action === 'BUY') groupB.push(item);
        else if(item.action === 'SELL') groupS.push(item);
        else console.warn(item);
      }else{
        // console.log(i + ' go next ' + item.timestamp + '  nextTime '+ nextTime);

        //console.log(nextTimed.getMinutes()  + ':'+ nextTimed.getSeconds())

        //console.log(new Date(item.timestamp).toTimeString());

        let time = new Date((item.timestamp + (step)));

        timestamps.push(time.getMinutes());

        avgB = UtilsOrder.takeAvarage(groupB, avgB);

        if(!avgB) avgB = avgS;
        avgB = +avgB.toPrecision(5);

        buys.push(avgB);
        if(!avgS) avgS = avgB;
        avgS = UtilsOrder.takeAvarage(groupS, avgS);

        avgS = +avgS.toPrecision(5);
        sells.push(avgS);


       //  console.log(i + ' nextTime ' + nextTime +' min ' +item.minutes + '  avgB  '+  avgB +' avgS ' + avgS, groupB, groupS);

        groupB = [];
        groupS = [];

        nextTime -=step
      }

      /* timestamps.push(item.timestamp);
       if(item.action === 'buy') buys.push(item);
       else if(item.action === 'sell') sells.push(item);
       else console.warn(item);*/
    });


    let time = new Date((end ));
    timestamps.push(time.getMinutes());

    avgB = UtilsOrder.takeAvarage(groupB, avgB);

    avgB = +avgB.toPrecision(5);

    buys.push(avgB);
    avgS = UtilsOrder.takeAvarage(groupS, avgS);

    avgS = +avgS.toPrecision(5);
    sells.push(avgS);



    return{
      bought:buys,
      sold:sells,
      timestamps:timestamps
    }
  }


}

