import {BittrexPrivateService} from "./bittrex-private.service";
import {BittrexService} from "../exchanges/services/bittrex.service";
import {VOOrder} from "../models/app-models";

import * as _ from 'lodash';
import {Subject} from "rxjs/Subject";
import {EventEmitter} from "@angular/core";
import {MappersBooks} from "../com/mappers-books";


export class EventTransfer{
  static ON_RATE = 'ON_RATE';
  static ON_ERROR= ' ON_ERROR';
  static ON_TRY_AGAIN = 'ON_TRY_AGAIN';
  static ON_ORDER_SET = 'ON_ORDER_SET';
  static ON_ORDER_CHECK = 'ON_ORDER_CHECK';
  static ON_DESTROY = 'ON_DESTROY';
  static ON_CHECKING_ORDRER = 'ON_CHECKING_ORDRER';
  static ON_ORDER_CHECK_RESULT = 'ON_ORDER_CHECK_RESULT';
  static ON_ORDER_END = 'ON_ORDER_END';

  constructor(public event:string, public message:any, public data:any){

  }


}
export class TransferReqest {
  private promise:Promise<string[]>;
  private resolve:Function;
  private reject:Function;
  private results:string[];
  private action:string;
  private market:string;
  //private coin:string;
  private base:string;

  private amountBase:number;
  private amountCoin:number;
  private booksRequire:number;
  private rate:number;
  private uuid:string;
  private isStop:boolean;
  private timeout;

  emitter:EventEmitter<EventTransfer>;



  /*
  * 0
:
{Quantity: 1723.77291348, Rate: 0.00001601, dQuantity: "1724", dRate: "0.00001601"}
1
:
{Quantity: 246.93750094, Rate: 0.000016, dQuantity: "246.9", dRate: "0.00001600"}
2
:
{Quantity: 950.29574706, Rate: 0.00001599, dQuantity: "950.3", dRate: "0.00001599"}*/


/*
* {Quantity: 3835.78317524, Rate: 0.00001613, dQuantity: "3836", dRate: "0.00001613"}
1
:
{Quantity: 2233.37754582, Rate: 0.00001614, dQuantity: "2233", dRate: "0.00001614"}

*/





  removeOrder(uuid?:string):Promise<string[]>{
    if(uuid) this.uuid = uuid;
    if(this.errors.length>20){
      this._onError('cant cancel order ' + this.uuid);
      return
    }
    this.privateService.cancelOrder(this.uuid).toPromise().then(res=>{

      this.privateService.getOrderById(this.uuid).toPromise().then((res:VOOrder)=>{
        console.log(res);
        this.results.push(JSON.stringify(res));
        if(res.IsOpen){
          this.errors.push(' cant cancel order ' + JSON.stringify(res));
          clearTimeout(this.timeout);
          this.timeout = setTimeout(()=>this.removeOrder(), 10000);
        }else {

          this.onSuccess();
        }
      })
    }).catch(err=>{
      this.errors.push(err.toString());
      clearTimeout(this.timeout);
      this.timeout = setTimeout(()=>this.removeOrder(), 10000);
    })

    return this.promise;
  }


  onOrderCheck(res){

  }

  openedCounter:number = 0;

  private checkOrder(){
    this.openedCounter++;
    if(this.openedCounter> 200){
      this._onError(' Order opened ');
    }
    this.emitter.next(new EventTransfer(EventTransfer.ON_CHECKING_ORDRER, 'Checking Order ' + this.uuid, null));

    this.privateService.getOrderById(this.uuid).subscribe((res:VOOrder)=>{
      console.log('ON_ORDER_CHECK_RESULT', res);
      this.onOrderCheck(res);
      this.results.push(JSON.stringify(res));
      if(res.IsOpen){
        this.emitter.next(new EventTransfer(EventTransfer.ON_ORDER_CHECK_RESULT, '', res));
        setTimeout(()=>this.checkOrder(), 10000);
      }else {
        console.log('ON_ORDER_END ')
        this.emitter.next(new EventTransfer(EventTransfer.ON_ORDER_END, '', res));
        this.onSuccess();
      }
    })
  }

  onOrderSet(res){



  }
 /* private startCheckOrder(){
    this.openedCounter = 0;
    this.emitter.next(new EventTransfer(EventTransfer.ON_CHECKING_ORDRER, 'Checking Order in 10 sec', null))
    clearTimeout(this.timeout)
    this.timeout = setTimeout(()=>this.checkOrder(), 10000);

  }*/

  getRateToBuyAmountBase(market:string, amountBase:number){
    this.market = market;
    let a  =  market.split('_')
    return this.publicService.getOrderBook(a[0], a[1]).map(res=> {
     // console.log(res);
      return TransferReqest.calculateRateForAmountBase(amountBase, res.sell);
    });

  }
///////////////////////////////////////////////////////////////
  static getRateToBuyAmountBase(market:string, amountBase:number, publicService:any ){
    return publicService.getOrderBook(market).map(res=> {
      // console.log(res);
      return TransferReqest.calculateRateForAmountBase(amountBase, res.sell);
    });
  }

  static calculateRateForAmountBase(amountBase:number, ar:{Quantity:number, Rate:number}[]){
    let total = 0;
    for(let i=0; i< ar.length; i++ ){

      total += ar[i].Quantity * ar[i].Rate;
     // console.log(total);
      if(total > amountBase) return ar[i].Rate;
    }

    return 0;

  }
///////////////////////////////////////////////////////////////////////////////////
  /*static calculateRateForAmount(amount:number, ar:{Quantity:number, Rate:number}[]){
    let total = 0;
    for(let i=0; i< ar.length; i++ ){
      total += ar[i].Quantity;
      if(total>amount) return ar[i].Rate;
    }

    return 0;

  }

*/

  private sellLimit(){
    if(this.errors.length > 10){
      this._onError('cant sell')
      return
    }
    if(this.isStop) return;
    if(!this.rate){
      this._onError('no rate to place sellLimit');
      return
    }

    if(!this.amountCoin) this.amountCoin = this.amountBase / this.rate;

    let amountCoin = this.amountCoin;
    let rate = this.rate;
    let market = this.market;

    let message = ' sellLimit ' + market + '  '+ amountCoin +'   '+rate + ' : ';
    //this.results.push(JSON.stringify(this.buy.slice(0,5)));
    this.results.push(message);

    console.warn(message);

    let a = market.split('_');

    let sub = this.privateService.sellLimit(a[0], a[1], amountCoin, rate).subscribe(res=> {

      console.log(res);
      this.results.push(JSON.stringify(res));
      this.onOrderSet(res);

      if(sub) sub.unsubscribe();

      if(!res){
        this.onServerError(' sellLimit result null');
      }else if(res && res.uuid) {

        this.uuid = res.uuid;
        this.emitter.next(new EventTransfer(EventTransfer.ON_ORDER_SET, this.uuid, this.uuid));
        this.timeout = setTimeout(()=>this.checkOrder(), 3000);

      }else if(res.message && res.message ==='INSUFFICIENT_FUNDS'){
        this.emitter.next(new EventTransfer(EventTransfer.ON_TRY_AGAIN, 'INSUFFICIENT FUNDS reducing amount', null));
        this.errors.push('INSUFFICIENT_FUNDS');
        this.amountCoin = this.amountCoin - (this.amountCoin*0.0025);
        this.sellLimit();
      }else {

        this.emitter.next(new EventTransfer(EventTransfer.ON_ERROR, res.message, res));
        this.onServerError('sellLimit unknown respond ' + JSON.stringify(res));

      }
    },(err)=>{
      this.onServerError(err.toString());

    });
  }

  private buyLimit(){
    if(this.errors.length>10){
      this._onError('cant buy')
      return
    }

    if(this.isStop) return;
    if(!this.rate){
    this._onError('no rate to place buyLimit');
      return
    }

    if(!this.amountCoin) this.amountCoin = this.amountBase / this.rate;
    let message = 'buyLimit ' + this.market + '  '+ this.amountCoin +'   '+this.rate + ' : ';
    //this.results.push(JSON.stringify(this.sell.slice(0,5)));
    this.results.push(message);
    let a = this.market.split('_');

    let sub = this.privateService.buyLimit(a[0], a[1], +this.amountCoin.toPrecision(8), this.rate).subscribe(res=> {
      console.log(res);
      this.onOrderSet(res);
      this.results.push(JSON.stringify(res));
      if(sub) sub.unsubscribe();

      if(!res) {
        this.onServerError(' buyLimit result null');
      }else if (res && res.uuid) {
        this.uuid = res.uuid;
        this.timeout = setTimeout(()=>this.checkOrder(), 3000);
      }else if(res.message && res.message ==='INSUFFICIENT_FUNDS') {
        this.errors.push('INSUFFICIENT_FUNDS');
        this.amountCoin = this.amountCoin - (this.amountCoin * 0.0025);
        this.buyLimit();
      }else{
        this.onServerError('unknown error '+ JSON.stringify(res));
      }
    },(err)=>{
      this.onServerError(err.toString());
    });
  }



  onServerError(message:string){
    console.warn(message);
    this.errors.push(message);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(()=>this.downloadBooks(), 20000);
  }

  private doAaction(){

    if(this.action ==='Sell')this.sellLimit();
    if(this.action === 'Buy')this.buyLimit();

  }

  errors = [];

  onRate(rate){

  }

  private downloadBooks(){
    if(this.isStop) return;

    console.error(' download books');

    if(this.errors.length > 10){
      this._onError('cant download books')
      return
    }


    let a  =  this.market.split('_')
   let sub= this.publicService.getOrderBook(a[0], a[1]).map(res=>{
      console.log(res);
      return res;

    }).subscribe(res=>{
      if(sub) sub.unsubscribe();

      if(this.action ==='Sell'){
        this.rate  = this.amountCoin ? MappersBooks.calculateRateForAmountCoin( res.buy, this.amountCoin) : MappersBooks.calculateRateForAmountBase(res.buy, this.amountBase);

        this.onRate(this.rate);
        this.emitter.next(new EventTransfer(EventTransfer.ON_RATE, '', this.rate));

        this.results.push(' Sell rate \'+ this.rate ');

        if(!this.rate){
          this.errors.push('no Sell books to cover order  ' +JSON.stringify(res.buy.slice(0.5)));

          clearTimeout(this.timeout);
          this.timeout = setTimeout(()=>this.downloadBooks(),20000);
        }
        else this.sellLimit();5
      }else if(this.action === 'Buy'){

        this.rate  =this.amountCoin ?  MappersBooks.calculateRateForAmountCoin( res.sell, this.amountCoin) : MappersBooks.calculateRateForAmountBase(res.sell, this.amountBase);
        console.log('Buy rate '+ this.rate)
        this.onRate(this.rate);
        this.results.push('Buy rate '+ this.rate);
        if(!this.rate) {
          this.errors.push('no Buy books to cover order '+JSON.stringify(res.sell.slice(0.5)));
          clearTimeout(this.timeout);
          this.timeout = setTimeout(()=>this.downloadBooks(),20000);
        }
        else this.buyLimit();

      }else this._onError('no action set');

      if(!this.rate){
        console.warn(' no rate redownload books in 10 sec rate: ' + this.rate);
        clearTimeout(this.timeout);
        this.timeout = setTimeout(()=>this.downloadBooks(),20000);
      }

    }, err=>{
      console.warn(' was error downlaod books redownloading in 10 sec ', err);
      this.errors.push('Error download books '+err.toString());

      if(this.errors.length > 20){
        this._onError(' cant download order books '+err.toString());
      }
      clearTimeout(this.timeout);
      this.timeout = setTimeout(()=>this.downloadBooks(),20000);

    })

    //return sub.asObservable();
  }

  static getRate(market:string, action:string, amountCoin:number, amountBase:number,  publicService:BittrexService):Promise<number>{

    let rate:number = 0;

    let a  =  market.split('_');

    return publicService.getOrderBook(a[0], a[1]).map(res=>{

      if(action ==='Sell'){
        rate  = amountCoin ? MappersBooks.calculateRateForAmountCoin( res.buy, amountCoin) : MappersBooks.calculateRateForAmountBase(res.buy, amountBase);

      }else if(action === 'Buy'){

        rate  = amountCoin ?  MappersBooks.calculateRateForAmountCoin( res.sell, amountCoin) : MappersBooks.calculateRateForAmountBase(res.sell, amountBase);;

      }else console.error('no action set');
      console.log(rate.toPrecision(4));

      return parseFloat(rate.toPrecision(5));
     // console.log(res);


    }).toPromise()

    //return sub.asObservable();
  }


  startProcess(){
    this.downloadBooks()
  }

  stop():TransferReqest{
    return this;
  }



  constructor(private privateService:BittrexPrivateService, private publicService:BittrexService){
    this.promise = new Promise((resolve, reject)=>{
      this.resolve = resolve;
      this.reject = reject;
    })
    this.results = [];
    this.emitter = new EventEmitter();
  }



  destroy(){
    this.emitter.next(new EventTransfer(EventTransfer.ON_DESTROY, '', null));
    clearTimeout(this.timeout);
    this.promise = null;
    this.resolve = null;
    this.reject = null;
    this.results = null;
    this.onOrderSet = null;
    this.onOrderCheck = null;
    this.onRate = null;
    this.emitter = null;
  }

  private onSuccess(){
    this.resolve(this.results);
    setTimeout(()=>this.destroy(),20);
  }

  private _onError(reason){
    this.errors.push(reason);
    this.reject(this.errors);
    setTimeout(()=>this.destroy(),20);
  }


  setTransfer(market:string, action:string, amountCoin:number, amountBase:number):Promise<string[]>{
    this.action = action;
    this.market = market;
    this.amountCoin = amountCoin;
    this.amountBase = amountBase;

    return this.promise;
  }
}
