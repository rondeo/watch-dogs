import { Injectable } from '@angular/core';
import {Observable} from "rxjs/Observable";
import {MappersBooks} from "../com/mappers-books";
import {VOOrderBook} from "../models/app-models";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

export interface APIBooksService{
  getOrderBook(base:string, coin:string):Observable<{buy:VOOrderBook[], sell:VOOrderBook[]}>
}


export interface VOBooksRate{
  buy:number;
  sell:number;
  buyUS?:number;
  sellUS?:number
}

@Injectable()
export class BooksService {

  constructor() { }

  base:string;
  coin:string;

  booksSell:VOOrderBook[];
  booksBuy:VOOrderBook[];
  exchangeService:APIBooksService;

  rateForAmountSub:BehaviorSubject<VOBooksRate> = new BehaviorSubject<VOBooksRate>({buy:0, buyUS:0, sellUS:0, sell:0});

  setService( exchangeService:APIBooksService){
    this.exchangeService = exchangeService;
  }

  refreshBooks(action?:string, amount?:number):Promise<number>{
    if(!amount) amount = this.amount;

      return this.downloadBooks().toPromise().then(res=>{
        console.log(res);
        this.dispatchBooks();
        if(action ==='Buy') {
          return BooksService.getRateForAmountBase(this.booksSell, amount)
        } else if(action ==='Sell'){
          return BooksService.getRateForAmountBase(this.booksBuy, amount)
        }else return 0;
      })
  }


  private downloadBooks():Observable<{sell:VOOrderBook[], buy:VOOrderBook[]}>{


    if(!this.base || !this.coin) return;

    return this.exchangeService.getOrderBook(this.base, this.coin).map(res=>{
      console.log(res);
      this.booksSell = res.sell;
      this.booksBuy = res.buy;
      this.dispatchBooks();
       /* let sell  = amountCoin ? BooksService.getRateForAmountCoin( res.buy, amountCoin) : BooksService.getRateForAmountBase(res.buy, amountBase);
        let buy  = amountCoin ?  BooksService.getRateForAmountCoin( res.sell, amountCoin) :BooksService.getRateForAmountBase(res.sell, amountBase);
*/
      return res;
    })

    //return sub.asObservable();
  }

  setMarket(base:string, coin:string){
    this.base = base;
    this.coin = coin;
    return this.downloadBooks().toPromise();
  }

  subscribeForRate():Observable<VOBooksRate>{
    return this.rateForAmountSub.asObservable();
  }

  private amount:number;
  setAmount(base:string, coin:string, amount:number):void{
    this.amount = amount;
    console.log(this.base,  this.coin);
    if(this.base === base && this.coin === coin){
     this.dispatchBooks();
    }else{
      this.setMarket(base, coin).then(res=>{

        this.dispatchBooks();
      }).catch(err=>{
        this.rateForAmountSub.next({buy:0, sell:0})
      })
    }

  }

  private dispatchBooks(){
    let amount = this.amount;
    if(!amount) return;
    this.rateForAmountSub.next({
      sell:BooksService.getRateForAmountBase(this.booksSell, amount),
      buy:BooksService.getRateForAmountBase(this.booksBuy, amount)
    })
  }

  static getRateForAmountBase(ar:VOOrderBook[], amountBase:number):number{
    let sum=0;
    for(let i =0, n=ar.length; i<n; i++){
      let item = ar[i];
      sum+= +item.Quantity * item.Rate;
      if(sum>=amountBase) return item.Rate;
    }

    return 0;
  }

  static getRateForAmountCoin(ar:VOOrderBook[], amountCoin:number):number{
    let prices:number[] = [];
    let sum=0;
    for(let i =0, n=ar.length; i<n; i++){
      let item = ar[i];
      sum+= +item.Quantity;
      if(sum>=amountCoin) return item.Rate;
    }
    return 0;
  }

}





