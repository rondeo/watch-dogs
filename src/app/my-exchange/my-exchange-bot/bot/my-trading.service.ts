import { Injectable } from '@angular/core';
import {VOMarketCap, VOOrder} from "../../../models/app-models";
import {ApiBase} from "../../services/apis/api-base";

import {UtilsOrder} from "../../../services/utils-order";
import {BooksService} from "../../../services/books-service";


@Injectable()
export class MyTradingService {

  constructor() {

  }





  getBots(){

  }

  excludeCoins:string[];
  addExclude(exchange:string, coin:string){
    let ind = this.excludeCoins.indexOf(coin);
    if(ind ===-1){
      this.excludeCoins.push(coin);
      let id = exchange + '-bot-exclude-coins';
      localStorage.setItem(id, JSON.stringify( this.excludeCoins));
    }
  }

  removeExclude(exchange:string, coin:string){
    let ind = this.excludeCoins.indexOf(coin);
    if(ind !== -1) {
      this.excludeCoins.splice(ind,1);
      let id = exchange + '-bot-exclude-coins';
      localStorage.setItem(id, JSON.stringify( this.excludeCoins));
    }

  }

  setExclude(exchange:string, coins:string[]){
    this.excludeCoins = coins;
    let id = exchange + '-bot-exclude-coins';
    localStorage.setItem(id, JSON.stringify(this.excludeCoins));
  }

  getExcludeCoins(exchange:string):string[]{
    if(!this.excludeCoins){
      let id = exchange + '-bot-exclude-coins';
      this.excludeCoins =  JSON.parse(localStorage.getItem(id) || '[]');
    }
    return this.excludeCoins;
  }


 buyCoin(
    api:ApiBase,
    base:string,
    coin:string,
    amountCoin:number
  ):Promise<VOOrder>{

    console.log(arguments)
    return new Promise<VOOrder>(function(resolve, reject){
     /* api.downloadBooks(base, coin).subscribe(books=>{
        console.log(books);

      })*/
    })
  }

}
