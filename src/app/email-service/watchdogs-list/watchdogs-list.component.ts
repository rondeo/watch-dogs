import {Component, OnDestroy, OnInit} from '@angular/core';
import {VOMarketCap, VOWatchdog} from "../../models/app-models";
import {WatchDogService} from "../watch-dog.service";
import {AuthHttpService} from "../../services/auth-http.service";
import {Router} from "@angular/router";
import {MarketCapService} from "../../market-cap/market-cap.service";

@Component({
  selector: 'app-watchdogs-list',
  templateUrl: './watchdogs-list.component.html',
  styleUrls: ['./watchdogs-list.component.css']
})
export class WatchdogsListComponent implements OnInit, OnDestroy {

  watchDogs:VOWatchdog[];
  MC:{[symbol:string]:VOMarketCap};
  constructor(
    private watchdogService:WatchDogService,
    private auth:AuthHttpService,
    private markrtCap:MarketCapService,
    private router:Router
  ) { }

  private sub1;
  ngOnInit() {
    this.markrtCap.getCoinsObs().subscribe(res=>{
      this.MC = res;
      this.mapMC();
    });

   this.sub1 =  this.watchdogService.watchdogs$().subscribe((res:any)=>{
      console.log(res);
      this.watchDogs = res;
      this.mapMC();
    })

    this.auth.getUser$().subscribe(res=>{
      console.log(res);
      if(res && res.session){
        this.watchdogService.refreshWatchdogs();
      }

    })
  }

  ngOnDestroy(){
    this.sub1.unsubscribe();
  }

  mapMC(){
    if(this.MC && this.watchDogs){
      this.watchDogs.forEach(function (item) {
        item.mc = this.MC[item.coin];
      }, {MC:this.MC})
    }
  }

  onNewClick(){
    let wd = new VOWatchdog();
    wd.id = (new Date()).toISOString();
    this.router.navigateByUrl('/email-service/watchdog-edit/' +wd.id );

  }

  onActiveClick(dog:VOWatchdog){
    console.log(dog);
    let action = dog.active?'Deactivate':'Activate';
    if(!confirm('You want to '+action+' Watchdog '+ dog.name +'?')) return;
    dog.active = !dog.active;

    this.watchdogService.saveWatchDogs().toPromise()
      .then(res=>{
      console.log(res);
        this.watchdogService.refreshWatchdogs();
    }).catch(err=>{
      console.error(err);
    })
  }

  onDeleteClick(dog:VOWatchdog){
    console.log(dog);
    if(!confirm('You want to delete Watchdog '+ dog.name +'?')) return;
    this.watchdogService.deleteWatchdog(dog).toPromise()
      .then(res=>{
        this.watchdogService.refreshWatchdogs();
        console.log(res);
      }).catch(err=>{
        console.error(err);
    })


  }

  onSymbolClick(dog:VOWatchdog){

    dog.isOpen = !dog.isOpen;

  }

  onNameClick(dog:VOWatchdog){
    this.router.navigateByUrl('/email-service/watchdog-edit/' +dog.id )
  }

}
