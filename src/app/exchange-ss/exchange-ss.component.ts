import {Component, OnInit } from '@angular/core';
import {ExchangeSsService} from './exchange-ss.service';
import {VOMarketCap, WalletModel} from '../models/app-models';
/*
import {WalletsAllService} from '../wallets/wallets-all.service';*/

import {ApiServerService} from '../api-server.service';
import {SendAlertService} from './send-alert.service';



@Component({
  selector: 'app-exchange-ss',
  templateUrl: './exchange-ss.component.html',
  styleUrls: ['./exchange-ss.component.css']
})
export class ExchangeSsComponent implements OnInit {

  myWallets:WalletModel[];
  _myWallets:WalletModel[];
  myCoins:VOMarketCap[];
  market:any;
  counter:number;

  start_stop ='Start';
  active:boolean;

  seconds:number;
  interval:any;
  tollerance:number = 5;
  constructor(
    private api:ApiServerService,
   /* private allWallets:WalletsAllService,*/
   // private coinsService:MarketCapSelectedService,
    private sendAlertService:SendAlertService
  ) { }

  ngOnInit() {

  /*  this.allWallets.myWallets$.subscribe(wallets=>{

      this._myWallets = wallets;
      this.refreshData();
    });
*/
    /*this.coinsService.selectedMarketIndexed$.subscribe(market =>{

      this.market = market;
      this.refreshData();



    })*/
   // this.exchangeService.init();
    //this.exchangeService.myWallets$.subscribe(res=>this.myWallets= res);

    //this.exchangeService.myCoins$.subscribe(res=>{
    //  console.log(res);
     // this.myCoins = res
   // });

  }

  refreshData(){

   /* if(!this.market || !this._myWallets) return;

    let market = this.market;

    let wallets = this._myWallets;
    this.counter = this.allCoins.counter;
    this.seconds = 30;
    let tollerance = 100/this.tollerance;
    let alerts:any[] = [];
    wallets.forEach(function (wallet) {

      let newMarket =  market[wallet.symbol];

      let newUsd = newMarket.price_usd;

      let newBTC = (newMarket.price_btc/1000);

      if(!wallet.analitics) wallet.analitics={price_usd_history:[newUsd], price_btc_history:[newBTC], price_usd_historyDisplay:''};

      let usdHistory = wallet.analitics.price_usd_history;
      let lastUsd = usdHistory[usdHistory.length-1];

      let report
      if(Math.abs(newUsd - lastUsd) > lastUsd*tollerance){
        usdHistory.push(newUsd);
        //if(ar1.length>10) ar1.shift();


        wallet.analitics.price_usd_historyDisplay = usdHistory.map(function (item) {
          return item.toFixed(2);
        }).toString();

        report = {
          symbol:newMarket.symbol,
          history: wallet.analitics.price_usd_historyDisplay

        }
      }


      console.log(wallet.analitics.price_usd_history);
      wallet.market = newMarket;

      wallet.usd =  (wallet.market.price_usd * wallet.balanceDisplay).toFixed(2);
      if(report) {
        report.have = wallet.usd;
        alerts.push(report)
      }

    });

    if(alerts.length)this.sendAlertService.sendMarketChange(alerts)
    this.myWallets = wallets;
*/

  }

  startStop(){
    if(this.start_stop === 'Start'){
      this.start_stop = 'Stop';
      this.active = true;
      this.seconds = 30;
      this.interval = setInterval(()=>{this.seconds++},1000);
     // this.coinsService.start();
    }else{
      this.start_stop = 'Start';
      this.seconds =0;
      clearInterval(this.interval);
      this.active = false;
      //this.coinsService.stop();
    }
  }

  updateBalance(wallet:WalletModel) {

    this.api.getBalance(wallet.symbol, wallet.address).subscribe(balance=>{
      console.log(balance);
    })

   // this.exchangeService.updateBalance(wallet);
  }

  onUsdClick(wallet){

  }



}
