import { Injectable } from '@angular/core';
import {Observable} from "rxjs/Observable";
import {MappersBooks} from "../com/mappers-books";
import {VOOrderBook, VOTrade} from "../models/app-models";
import {BehaviorSubject} from "rxjs/BehaviorSubject";


export interface APIBooksService{
  getOrderBook(base:string, coin:string):Observable<{buy:VOTrade[], sell:VOTrade[]}>
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

  booksSell:VOTrade[];
  booksBuy:VOTrade[];
  exchangeService:APIBooksService;

  rateForAmountSub:BehaviorSubject<VOBooksRate> = new BehaviorSubject<VOBooksRate>(null);

  setService( exchangeService:APIBooksService){
    this.exchangeService = exchangeService;
  }

  refreshBooks(action?:string, amount?:number):Promise<number>{
    if(!amount) amount = this.amount;

      return this.downloadBooks().toPromise().then(res=>{

        if(action ==='Buy') {
          return BooksService.getRateForAmountBase(this.booksSell, amount)
        } else if(action ==='Sell'){
          return BooksService.getRateForAmountBase(this.booksBuy, amount)
        }else return 0;
      })
  }


  private downloadBooks():Observable<{sell:VOTrade[], buy:VOTrade[]}>{
    if(!this.base || !this.coin) return;

    return this.exchangeService.getOrderBook(this.base, this.coin).map(res=>{
     // console.log(res);
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
    if(base && coin) return this.downloadBooks().toPromise();
    else this.rateForAmountSub.next({sell:0, buy:0});
  }

  subscribeForRate():Observable<VOBooksRate>{
    return this.rateForAmountSub.asObservable();
  }

  private amount:number = 1;
  setAmount(amount:number):void{
    //console.log('setting amount ' + amount);
    this.amount = amount;
     this.dispatchBooks();
  }

  private dispatchBooks(){
    let amount = this.amount;
    if(!amount || !this.booksSell || !this.booksBuy) return;
    //console.log('amount  ' + amount);
    this.rateForAmountSub.next({
      sell:BooksService.getRateForAmountBase(this.booksSell, amount),
      buy:BooksService.getRateForAmountBase(this.booksBuy, amount)
    })
  }

  static getRateForAmountBase(ar:VOTrade[], amountBase:number):number{
    let sum=0;
   // console.error(ar);
    for(let i =0, n=ar.length; i<n; i++){
      let item = ar[i];
      sum+= +item.amountCoin * item.rate;
      if(sum>=amountBase) return item.rate;
    }

    return 0;
  }

  static getRateForAmountCoin(ar:VOTrade[], amountCoin:number):number{
    let prices:number[] = [];
    let sum=0;
    for(let i =0, n=ar.length; i<n; i++){
      let item = ar[i];
      sum+= +item.amountCoin;
      if(sum>=amountCoin) return item.rate;
    }
    return 0;
  }

}





