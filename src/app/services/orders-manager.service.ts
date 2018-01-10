import { Injectable } from '@angular/core';
import {VOOrder} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {SOBuySell} from "../bittrex/bittrex-private.service";


export interface APIOrdersManager{
  cancelOrder(uuid:string):Observable<SOBuySell>
  getOrderById(uuid:string):Observable<VOOrder>
}


@Injectable()
export class OrdersManagerService {

  private uuid:string;
  private privateService:APIOrdersManager;
  constructor() { }



  removeOrder(uuid?:string):Promise<string[]>{
    if(uuid) this.uuid = uuid;


    this.privateService.cancelOrder(this.uuid).toPromise().then(res=>{

      this.privateService.getOrderById(this.uuid).toPromise().then((res:VOOrder)=>{
        console.log(res);
        //this.results.push(JSON.stringify(res));
        if(res.IsOpen){
          //this.errors.push(' cant cancel order ' + JSON.stringify(res));
          // clearTimeout(this.timeout);
          // this.timeout = setTimeout(()=>this.removeOrder(), 10000);
        }else {

          //this.onSuccess();
        }
      })
    }).catch(err=>{
      //this.errors.push(err.toString());
      //clearTimeout(this.timeout);
      //this.timeout = setTimeout(()=>this.removeOrder(), 10000);
    })

    return  null;//this.promise;
  }

  onError(error){

  }

}
