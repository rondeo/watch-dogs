import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOMarketCap, VOWatchdog} from "../../models/app-models";
import {WatchDogService} from "../watch-dog.service";
import {AuthHttpService} from "../../services/auth-http.service";
import {Router} from "@angular/router";
import {MarketCapService} from "../../market-cap/services/market-cap.service";
import {StorageService} from "../../services/app-storage.service";
import * as moment from "moment";
import * as _ from 'lodash';

@Component({
  selector: 'app-watchdogs-list',
  templateUrl: './watchdogs-list.component.html',
  styleUrls: ['./watchdogs-list.component.css']
})
export class WatchdogsListComponent implements OnInit, OnDestroy {

  watchDogs:VOWatchdog[];
  MC:{[symbol:string]:VOMarketCap};
  constructor(
  //  private watchdogService:WatchDogService,
    private auth:AuthHttpService,
    private markrtCap:MarketCapService,
    private router:Router,
    private storage:StorageService
  ) { }


  ngOnInit() {
    this.initAsync();
  }

  async initAsync(){
    this.watchDogs = await this.storage.getWatchDogs();
  }


  ngOnDestroy(){
   // this.sub1.unsubscribe();
  }

  mapMC(){
    if(this.MC && this.watchDogs){
      this.watchDogs.forEach(function (item) {
        item.mc = this.MC[item.coin];
      }, {MC:this.MC})
    }
  }

  onNewClick(){

    this.router.navigateByUrl('/email-service/watchdog-edit/' +moment().toISOString() );

  }


  async onDeleteClick(dog:VOWatchdog){
    console.log(dog);
    if(!confirm('You want to delete Watchdog '+ dog.name +'?')) return;
    let allDogs = await this.storage.getWatchDogs();

    allDogs = allDogs.filter(function (item) {
      return item.id && item.id !== dog.id;
    })

   await this.storage.saveWatchDogs(allDogs);
   this.watchDogs = await this.storage.getWatchDogs();
  }

  onNameClick(dog:VOWatchdog){
    this.router.navigateByUrl('/email-service/watchdog-edit/' +dog.id )
  }

}
