import { Injectable } from '@angular/core';
import {ApiBase} from "../../services/apis/api-base";
import {VOOrder} from 'app/my-exchange/services/my-models';
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";


export enum SetOrderErros{
  ORDER_OPEN,
  API_SET_OPDER,
  API_CHECK_ORDER
}


@Injectable()
export class BuyCoinService {


  newOrderSub:Subject<VOOrder>;

  newOrder$():Observable<VOOrder>{
    return this.newOrderSub.asObservable();
  }

  constructor() {
    this.newOrderSub = new Subject<VOOrder>()
  }


  openOrderCount:number;
  errorsCount:number;

  checkOrder(api:ApiBase,  order:VOOrder, callBack:(err, res)=>void){
    let base = order.base;
    let coin = order.coin;

    api.getOpenOrders(base, coin).subscribe(orders=>{
      if(orders.length){

        let myOrder = orders.find(function (item) {
          return item.uuid === order.uuid
        })

        if(myOrder){
          this.openOrderCount++;
          if(this.openOrderCount > 9) callBack({error:SetOrderErros.ORDER_OPEN, message:'3 min order open'}, order);
          else setTimeout(()=>{

            this.checkOrder(api, order, callBack);

          }, 20000);

        } else{
          order.isOpen = false;
          callBack(null, order);
        }


      }
    }, error2 => {
      this.errorsCount++;
      if(this.errorsCount> 5) callBack({error:SetOrderErros.API_CHECK_ORDER, message:'check order error '+ api.exchange}, order);

    })
  }



  sendOrder(api:ApiBase, action:string, base:string, coin:string, amountCoin:number, rate:number, callBack:(err, order:VOOrder)=>void){

    let obs= action ==='BUY'?api.buyLimit(base, coin, amountCoin, rate ):api.sellLimit(base, coin, amountCoin, rate );

      obs.subscribe(order=>{

      callBack(null, order);

      }, err=>{

        this.errorsCount++;

        if(this.errorsCount> 4) callBack({error:SetOrderErros.API_SET_OPDER, message:action + ' 5 times error  '+api.exchange}, null);
        else {

          setTimeout(()=>{

            this.sendOrder(api, action, base, coin, amountCoin, rate, callBack);

          }, 10000);

        }

    });

  }



  tradeCoin(api:ApiBase, action:string,  base:string, coin:string, amountCoin:number, rate:number):Promise<VOOrder>{

    return new Promise((resolve, reject)=>{

     this.openOrderCount = 0;
     this.errorsCount = 0;

      this.sendOrder(api, action, base, coin, amountCoin, rate, (err, order)=>{

        if(!err){

          this.errorsCount = 0;
          if(order.isOpen){
            this.checkOrder(api, order, (err, res)=>{

            })
          }else resolve(order)

        }else reject(err);

      })
    })

  }

}
