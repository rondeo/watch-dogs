import { Injectable } from '@angular/core';
import {VOMarketCap, WalletModel} from '../models/app-models';


import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {Http} from '@angular/http';
import {ApiServerService} from '../api-server.service';
@Injectable()
export class ExchangeSsService {

  private myWallets:WalletModel[];
  private myWalletsSub:BehaviorSubject<WalletModel[]>;
  myWallets$:Observable<WalletModel[]>

  private myCoins:VOMarketCap[];
  private myCoinsSub:BehaviorSubject<VOMarketCap[]>;
  myCoins$:Observable<VOMarketCap[]>

  myCoinsSymbols:string[];
  allCoins:VOMarketCap[];


  constructor(
   // private allWallets:WalletsAllService,
   // private allCoinsService:MarketCapSelectedService,
    private api:ApiServerService
  ) {

    this.myWalletsSub =  new BehaviorSubject<WalletModel[]>([])
    this.myWallets$ = this.myWalletsSub.asObservable();
    /*allWallets.myWallets$.subscribe(res=>{
      this.myWallets = res;
      this.myCoinsSymbols = this.filterWalletsSymbolsUnique(res);
      this.myWalletsSub.next(this.myWallets);
      this.populateCoins();

    });//this.walletsSub.asObservable();*/

    this.myCoinsSub = new BehaviorSubject([]);
    this.myCoins$ = this.myCoinsSub.asObservable();

    //allWallets.loadConfig();
    //allWallets.loadWallets()

 /*   allCoinsService.allCoins$.subscribe(res=>{
      this.allCoins = res;
      this.populateCoins();

    })

    allCoinsService.loadData();*/

  }


  updateBalance(wallet:WalletModel){

    this.api.getBalance(wallet.symbol, wallet.address).subscribe(res=>{
      console.log(res);
    })

  }


  populateCoins(){
    let coins:VOMarketCap[] = this.allCoins;
    if(!coins) return;
    let ar:VOMarketCap[] = [];
    let symbols:string[] = this.myCoinsSymbols;
    coins.forEach(function (coin) {
      if(symbols.indexOf(coin.symbol) !==-1)ar.push(coin)
    })
    this.myCoins = ar;
    this.myCoinsSub.next(this.myCoins);
  }



  filterWalletsSymbolsUnique(wallets:WalletModel[]):string[]{
    let ar:string[]=[]
    wallets.forEach(function (wallet) {
      if(ar.indexOf(wallet.symbol) ===-1) ar.push(wallet.symbol)
    })
    return ar;
  }

  init(){



  }

}
