import { Injectable } from '@angular/core';
import {VOOrder} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {SOBuySell} from "../bittrex/bittrex-private.service";
import {Subject} from "rxjs/Subject";


export interface APIOrdersManager{
  cancelOrder(uuid:string):Observable<VOOrder>
  getOrderById(uuid:string):Observable<VOOrder>
}


@Injectable()
export class OrdersManagerService {

  private uuid:string;

  private privateService:APIOrdersManager;

  private statusSub:Subject<VOOrder> = new Subject();
  private errorsSub:Subject<string> = new Subject();

  constructor() {

  }

  setService(service:APIOrdersManager){
    this.privateService = service;
  }
  checkOrder(uuid):Observable<VOOrder>{
    this.uuid = uuid;
    setTimeout(()=>this.checkCurrentOrder(), 2000);
    return this.statusSub.asObservable();
  }

  checkCurrentOrder(){
    let uuid = this.uuid;
    if(!uuid) return;
    this.privateService.getOrderById(uuid).toPromise().then((res:VOOrder)=>{
      console.log(res);
      if(res.isOpen){
        setTimeout(()=>this.checkCurrentOrder(), 3000);
      }
      this.statusSub.next(res);
    });

  }


  cancelOrder(uuid?:string):Observable<VOOrder>{

    if(!uuid) uuid = this.uuid;
    else this.uuid = uuid;
    if(!uuid) return;
    this.privateService.cancelOrder(this.uuid).toPromise().then(res1=>{

      this.privateService.getOrderById(this.uuid).toPromise().then((res:VOOrder)=>{
        console.log(res);
        //this.results.push(JSON.stringify(res));
        if(res.isOpen){
            setTimeout(()=>this.cancelOrder(), 10000);
        }
        this.statusSub.next(res);

      })
    }).catch(err=>{
      this.onError(err);
      this.errorsSub.next(err.message);

    });

    return  this.statusSub.asObservable();
  }

  onError(error){

  }

  destroy() {
    this.uuid = null;

  }
}
