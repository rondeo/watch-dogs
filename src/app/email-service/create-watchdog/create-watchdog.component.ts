import {Component, OnDestroy, OnInit} from '@angular/core';

import * as _ from 'lodash';
import {EmailServiceService} from '../email-service.service';
import {DialogSimpleComponent} from '../../shared/dialog-simple/dialog-simple.component';
import {MatDialog} from '@angular/material';
import {VOMarketCap, WatchDog} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {ActivatedRoute, Router} from '@angular/router';


@Component({
  selector: 'app-create-watchdog',
  templateUrl: './create-watchdog.component.html',
  styleUrls: ['./create-watchdog.component.css']
})
export class CreateWatchdogComponent implements OnInit, OnDestroy {


  watchDog:WatchDog;
  coinMarket:VOMarketCap;
  markets:{[symbol:string]:VOMarketCap};
  coinsSelected:VOMarketCap[] =[];
 // selectedCoins:{[symbol:string]:VOExchangeData};
  watchDogs:WatchDog[]=[];


  sortCriteria:string = 'rank';
  asc_desc='asc';

  constructor(
    //private marketCap:MarketCapService,
    private emailService:EmailServiceService,
    private dialog:MatDialog,
    private router:Router,
    private route:ActivatedRoute
  ) {
    this.watchDog = this.emailService.currentWatchDog;
  }


  private sub1;
  private sub2;
  //private sub3;
  ngOnInit() {

    let uid:string;

    this.sub1 = this.route.params.subscribe(params => {
      console.log(params);
      uid = params['uid'];

      if(this.watchDogs)this.setCurrentById(uid);
    });


    this.sub2 =  this.emailService.watchDogs$.subscribe(res=>{
     // console.log(res);
      if(!res) return;
      this.watchDogs = res;
      console.log(' uid ' + uid);
      if(uid)this.setCurrentById(uid);

      this.coinsSelected = this.emailService.marketCap.getSelected()
    });

    this.emailService.getWatchDogs();
  }

  setCurrentById(uid:string){
    console.log(uid);
    if(!uid || ! this.emailService.marketCapData) return;
    //if(!uid || !this.watchDogs || this.watchDogs.length ===0) return;

    uid = uid.toUpperCase();

    let dog  = this.watchDogs.find(function (item) {
      return item.uid === uid;
    });
    if(dog) this.watchDog = dog;


    console.log(this.watchDog)
  }


  ngOnDestroy() {
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }


  onDeleteClick(dog:WatchDog){
    console.log(dog);

    let ref = this.dialog.open(DialogSimpleComponent, {data:{
      title:'Alert',
      message:'You want to delete watch dog '+ dog.uid + ' '+ dog.coinId+'?',
      buttons:['Yes','No']
    }})

    ref.afterClosed().subscribe(res=>{
      console.log(res);
      if(res==='Yes')  this.emailService.deleteDog(dog);
    })
  }



/*  setMarket(market:{[symbol:string]:VOExchangeData}){
    //this.marketsRaw = market;
    //this.coinsAvailable = _.values(market);
    this.mergeData();

  }*/

  saveDogClick(){

    let exists = this.emailService.getDogByUid(this.watchDog.uid);
    if(!exists){

      this.emailService.addDog(this.watchDog)
    }
    this.emailService.saveData();
   // this.watchDog.market = this.coinMarket;
   // this.watchDog.uid = this.emailService.createUid(this.watchDog.symbol);
      ;
  }


  /*onClickHeader(criteria:string):void{

    if(this.sortCriteria === criteria){
      if(this.asc_desc === 'asc') this.asc_desc ='desc';
      else  this.asc_desc='asc';
    }else this.asc_desc = 'asc';
    console.log(this.asc_desc);
    this.sortCriteria = criteria;
    //this.setData(this.watchDogs);

  }*/



  onDogClick(dog:WatchDog){
    this.router.navigateByUrl('/email-service/edit-watchdogs/'+dog.uid);
   // this.watchDog = dog;
  }

  onScriptClick(dog:WatchDog){
    this.router.navigateByUrl('/email-service/edit-script/'+dog.uid);
  }

  onCoinSelectChanged(evt){
    console.log(evt.value);
    let id = evt.value;

   let marketCap:VOMarketCap = this.coinsSelected.find(function (item) {
      return item.id === id;
    });

    let wd  = this.emailService.getNewWatchDog();
    wd.coinId = id;
    wd.uid = this.emailService.createUid(marketCap.symbol);
    wd.dogName = marketCap.name;
    this.watchDog = wd;
    this.coinMarket = marketCap;




   /* let cfg = this.allWalletsService.getCoinConfigBySymbol(event.value);
    if(!cfg) return
    console.log(cfg);

    this.wallet.symbol = cfg.symbol;
    this.wallet.network = cfg.network;
    this.wallet.displayName = cfg.displayName;
    let wallets =  this.allWalletsService.getAllWallets();

    if(!this.wallet.label) {

      let exists = _.filter(wallets, {symbol:this.wallet.symbol});
      this.wallet.label = this.wallet.symbol + ' '+ exists.length;
    }



    if(cfg.contractAddress){
      let network = cfg.network;
      let networkWallets = this.allWalletsService.getMyWalletsBySymbol(network);

      if(networkWallets.length){
        let pk = networkWallets[0].privateKey;
        if(!this.wallet.privateKey) this.wallet.privateKey = pk;



      }else{
        this.dialog.open(DialogSimpleComponent, {data:{message:'You have to have wallet on '+ cfg.network}})
      }


      // let parent:WalletModel = this.waletsService.getWalletBySymbol(cfg.parent);
      // console.log(parent)
      //  if(parent){



    }else {


    }*/

  //  this.generateAddress();

  }

}
