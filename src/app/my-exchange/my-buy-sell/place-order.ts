import {Observable} from "rxjs/Observable";
import {VOOrder} from "../../models/app-models";
import {MatSnackBar} from "@angular/material";
import {ApiBase} from "../services/apis/api-base";

export function placeOrder(
  action:string,
  base:string,
  coin:string,
  priceBaseUS:number,
  rate:number,
  amountCoin:number,
  balanceBase:number,
  balanceCoin:number,
  currentAPI:ApiBase,
  snackBar:MatSnackBar
):Promise<VOOrder>{

  return new Promise<VOOrder>(function(resolve, reject){

       //console.log(isActive, amountBase, isMax);
      action = action.toUpperCase();

      amountCoin = +(amountCoin).toPrecision(5);

      let rateUS = +(rate * priceBaseUS).toPrecision(4);

      let amountUS = (amountCoin * rate * priceBaseUS).toFixed(2);


      let feeUS = (+amountUS * 0.0025).toFixed(2);
        console.log(action + ' '+base +'_'+ coin + ' amountCoin '+amountCoin +' rate '+rate + ' baseUS ' + priceBaseUS);

      if(confirm( action +'  '+ coin +' \nPrice: $'+rateUS + ' \nAmount: $'+ amountUS +  '\nFee: $' + feeUS)){
        // let service:APIBuySellService = this.privateService;
        let obs:Observable<VOOrder>;

        //obs = currentAPI.stopLoss(base, coin, amountCoin, rate );

        if(action ==='SELL') obs =  currentAPI.sellLimit(base, coin, amountCoin, rate );
        else if(action ==='BUY')obs = currentAPI.buyLimit(base, coin, amountCoin, rate );

        if(!obs) {
          console.error(action);
          reject({message:'no isActive '+action});
          return;
        }

        obs.subscribe((res:VOOrder)=>{

          console.log(res);
          if(res && res.uuid){

            let order = {
              action:action,
              uuid:res.uuid,
              isOpen:true,
              base:base,
              coin:coin,
              amountBase:amountCoin * rate,
              amountCoin:amountCoin,
              rate:rate,
              fee:+feeUS,
              priceBaseUS:priceBaseUS
            };

            let msg = action + ' ' + coin + ' $' +amountUS;
            snackBar.open('Order Set! '+msg, 'x', {extraClasses:'alert-green', duration:2000});
            resolve(order)
            //resolve(order);

          } else{
            reject({message:'Error '+res.message});
            snackBar.open('Error '+res.message, 'x', {extraClasses:'alert-red', duration:3000})
          }

        }, error=>{
          reject(error)
          snackBar.open('Error '+ error.message, 'x',{extraClasses:'alert-red'});
        })

      }

  });
}