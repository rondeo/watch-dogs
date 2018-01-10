import { Component, OnInit } from '@angular/core';
import {VOMarketCap, VOWatchdog} from "../../models/app-models";
import {ActivatedRoute} from "@angular/router";
import {WatchDogService} from "../watch-dog.service";
import {StorageService} from "../../services/app-storage.service";
import {MarketCapService} from "../../market-cap/market-cap.service";
import {MatSnackBar} from "@angular/material";



@Component({
  selector: 'app-watchdog-edit',
  templateUrl: './watchdog-edit.component.html',
  styleUrls: ['./watchdog-edit.component.css']
})
export class WatchdogEditComponent implements OnInit {

  watchDog:VOWatchdog;

  selectedCoins:string[];
  MC:{[symbol:string]:VOMarketCap};
  coinMC:VOMarketCap = new VOMarketCap();

  constructor(
    private route:ActivatedRoute,
    private watchdogService:WatchDogService,
    private storage:StorageService,
    private marketCap:MarketCapService,
    private snackBar:MatSnackBar
  ) {
    this.watchDog = new VOWatchdog();
    this.watchDog.active = true;
  }

  ngOnInit() {
    this.selectedCoins = this.storage.getSelectedMC();
    let id = this.route.snapshot.paramMap.get('uid');

    this.watchdogService.watchdogs$().subscribe(res=>{
      console.log(res);
      if(!res){
        this.watchdogService.refreshWatchdogs();
        return;
      }

      let dog = res.find(function (item) {
        return item.id == id;
      })

      if(!dog){
        this.watchDog.id = id;
      }else this.watchDog = dog;


      this.displayMC();

    });


    this.marketCap.getCoinsObs().subscribe(res=>{
      this.MC = res;
      this.displayMC();
    })

  }


  displayMC(){
    if(!this.MC) return;
    let coin = this.watchDog.coin;
    if(!coin) return;
    this.coinMC = this.MC[coin];

  }
  onMinusClick(){
    if(this.watchDog.percent_change_1h) this.watchDog.percent_change_1h = -this.watchDog.percent_change_1h;
  }
  onPercent1hLess(){
    this.watchDog.percent_change_1hLess = !this.watchDog.percent_change_1hLess;
  }

  onCoinChange(evt){
    //let coin = evt.value
    let coin = this.watchDog.coin;
    this.displayMC();
    console.log(coin);
  }

  saveWatchdog(){

    if(!this.watchDog.name || this.watchDog.name.length < 2){

      this.snackBar.open('Name minimum length 2', 'x', {duration:3000});
      return
    }
    if(!this.watchDog.coin || this.watchDog.coin.length < 2){
      this.snackBar.open('Coin minimum length 2', 'x', {duration:3000});
      return
    }
    if(!this.watchDog.percent_change_1h){
      this.snackBar.open('% 1h can not be null', 'x', {duration:3000});
      return
    }


    this.watchdogService.saveWatchDog(this.watchDog).toPromise().then(res=>{

      if(res.result){
        this.snackBar.open(this.watchDog.name + ' Saved on server', 'x', {duration:2000});
      }

    }).catch(err=>{
      console.error(err)
    })
  }
}
