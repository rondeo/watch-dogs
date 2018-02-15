import {Observable} from "rxjs/Observable";
import {VOOrder} from "../../models/app-models";
import {MatSnackBar} from "@angular/material";
import {ApiBase} from "../services/apis/api-base";

export function placeOrder(
  action:string,
  base:string,
  coin:string,
  rateToBuyUS:number,
  rateToSellUS:number,
  priceBaseUS:number,
  amountUS:number,
  balanceBase:number,
  balanceCoin:number,
  currentAPI:ApiBase,
  snackBar:MatSnackBar
):Promise<VOOrder>{

  console.log(arguments);
  return new Promise<VOOrder>(function(resolve, reject){

    let amountBase = amountUS / priceBaseUS;



      //console.log(action, amountBase, isMax);

      action = action.toUpperCase();


      if((amountBase * priceBaseUS) < 10){
       snackBar.open(' You have '+ (amountBase * priceBaseUS).toFixed(0) + ' min $10 ','x', {duration:3000, extraClasses:'alert-red'});
        return
      }


      let rateToBuy = rateToBuyUS / priceBaseUS;//// this.rates.rateToBuy;
      let rateToSell = rateToSellUS / priceBaseUS;// this.rates.rateToSell;


      if(!rateToBuy || !rateToSell){
        snackBar.open('Refresh Books! ', 'x', {extraClasses:'alert-red', duration:2000});
        reject({message:'Refresh Books! '});
        return
      }

      let rate = 0
      let amountCoin = 0;
      if(action === 'SELL'){

        rate = rateToSell;//BooksService.getRateForAmountBase(books.buy, amountBase);
        amountCoin = amountBase / rate
        let balance = balanceCoin;
        balance = (balance - (balance * 0.0025));
        if(amountCoin > balance) amountCoin = balance;



      } else {

        let balance = balanceBase;
        balance = (balance - (balance * 0.0025));
        if(amountBase > balance) amountBase = balance;
        rate = rateToBuy;//BooksService.getRateForAmountBase(books.sell, amountBase);
        amountCoin = amountBase / rate;
      }

      rate = +(+rate.toFixed(8)).toPrecision(5);
      //TODO why do i need amountUS recalculate
      amountUS = (amountCoin * rate * priceBaseUS);

      ///rate = parseFloat(rate+'');
      amountCoin = +(amountCoin).toPrecision(5);


      let rateUS = +(rate * priceBaseUS).toPrecision(4);


      // if(rate<1e-3) rate = +(rate.toFixed(8));
      console.log(' rateUS  ' + rateUS + ' rate ' + rate);

      console.log(' amountCoin ' + amountCoin + ' on balance ');

      let amountBaseUS = +(amountBase * priceBaseUS).toFixed(2);


      let feeUS = (amountUS * 0.0025);

      //setTimeout(()=>{

      console.log(action + ' '+base +'_'+ coin + ' '+amountCoin +' '+rate + ' baseUS ' + priceBaseUS);

      if(confirm( action +' x '+rateUS + ' \n' +coin  +' $'+ amountUS.toFixed(2) +  '\nFee: $' + feeUS.toFixed(2))){

        // let service:APIBuySellService = this.privateService;
        let obs:Observable<VOOrder>;


        if(action ==='SELL') obs =  currentAPI.sellLimit(base, coin, amountCoin, rate );
        else if(action ==='BUY')obs = currentAPI.buyLimit(base, coin, amountCoin, rate );

        if(!obs) {
          console.error(action);
          reject({message:'no action '+action});
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
              amountBase:amountBase,
              amountCoin:amountCoin,
              rate:rate,
              fee:feeUS,
              priceBaseUS:priceBaseUS
            };

            let msg = action + ' ' + coin + ' $' +amountUS.toFixed(0);
            snackBar.open('Order Set! '+msg, 'x', {extraClasses:'alert-green', duration:2000});
            resolve(order);
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