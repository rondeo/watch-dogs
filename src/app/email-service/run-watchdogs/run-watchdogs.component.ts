import {AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';


import {EmailServiceService} from '../email-service.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import * as _ from 'lodash';
import {runDogScript} from './script-analytics';
import {VOMarketCap} from '../../models/app-models';
import {MarketCapService} from '../../market-cap/market-cap.service';
import {Router} from '@angular/router';
import {WatchDog} from '../../my-bot/services/watch-dog';


@Component({
  selector: 'app-run-watchdogs',
  templateUrl: './run-watchdogs.component.html',
  styleUrls: ['./run-watchdogs.component.css']
})
export class RunWatchdogsComponent implements OnInit, AfterViewInit, OnDestroy {


  counter: number = 0;
  watchDogs: WatchDog[] = [];
  isRunning: boolean;
  progress: number;
  seconds: number;
  refreshSeconds = 60 * 60;
  interval: any;

  start_stop: string = 'Start Refresh Timer';


  constructor(
    private marketCap: MarketCapService,
    private emailService: EmailServiceService,
    private dialog: MatDialog,
    private snakBar: MatSnackBar,
    private router: Router
  ) {
  }


  newData: any;

  private sub1;
  private sub2;

  ngOnInit() {

    this.sub1 = this.emailService.watchDogs$.subscribe(res => {
      if (!res) return;
      console.log(res);
      this.watchDogs = res;
    });

/*
    this.sub2 = this.marketCap.coinsAr$.subscribe(newData => {
      // let data = this.marketCap.coins;
      // if(!data) return;
      // this.newData = data;
      // this.runAnalytics();

      /!*  console.log('new data');

       // console.log(newData);

        //  console.log('this.marketCap.coinsId$  triggered ');
        this.runAnalytics();*!/
    })*/


  }

  ngAfterViewInit() {
    // console.log();
  }

  ngOnDestroy() {
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
  }

  onEditDog(dog: WatchDog) {

    this.router.navigateByUrl('/email-service/dog-edit/' + dog.uuid);

  }

  runAnalytics() {

    let newValues: { [id: string]: VOMarketCap } = this.newData;

    if (!this.isRunning) return;


    if (!this.newData) {
      console.warn(' no data');
      return;
    }
    this.counter++;

    let ar: WatchDog[] = this.watchDogs.filter(function (item) {
      return item.status === 'active';
    });
    let results: string[] = [];

    let subjects: string[] = [];

    ar.forEach(function (item) {
      /* let newValue = newValues[item.coin];
      // let oldValue = item.marketCap;
      // let script = item.scriptText;

       if(script && oldValue && newValue){
         let res =  runDogScript(oldValue, newValue, script);
         if(res.length){
           subjects.push('Watchdog '+item.dogName);
           results.push('Triggered '+ item.dogName + "\n" + (item.description || '') );
           results = results.concat(res);
           results.push(' end '+ item.dogName +"\n\r");
         }
       }//else console.warn(script ,oldValue, newValue);
 */
    })


    console.log('results ', subjects);

    if (subjects.length === 0) return;

    let message = results.join('\n');

    this.emailService.sendNotification(subjects.toString(), message).subscribe(res => {
      console.log(res);
      if (res && res.message) this.snakBar.open(res.message, 'x', {duration: 3000});
      else this.snakBar.open('Error send email', 'x', {duration: 3000});
    });
  }


  onStatusClick(dog) {
    if (!dog.scriptText) {
      dog.status === 'empty';
      this.snakBar.open('Please create Script to run Watchdog', 'x', {duration: 3000});
      return;
    }
    if (dog.status === 'active') dog.status = 'stop';
    else dog.status = 'active';
    dog.statusIcon = dog.status !== 'active' ? 'fa fa-play' : 'fa fa-pause';

  }


  onScriptClick(dog: WatchDog) {
    this.router.navigateByUrl('/email-service/edit-script/' + dog.uuid);
  }

 /* loadData() {
    this.marketCap.refresh();
  }
*/
  onDogClick(dog: WatchDog) {
    this.router.navigateByUrl('/email-service/edit-watchdogs/' + dog.uuid);
  }

  stopTimer() {
    if (!this.isRunning) return;
    this.seconds = 0;
    this.progress = 0;
    clearInterval(this.interval);
    this.isRunning = false;
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.progress = 20;
    this.seconds = 0;
   // this.loadData();
    this.interval = setInterval(() => {
      this.seconds++
      this.progress = 5 + (this.seconds / this.refreshSeconds) * 100;
      if (this.seconds > this.refreshSeconds) {
        this.seconds = 0;
        // this.loadData();
      }
    }, 1000);
  }

  startStopTimer() {
    if (!this.isRunning) this.startTimer();
    else this.stopTimer();
  }

  private errors: string[] = [];

  saveError(error: string) {
    this.errors.push(error);
  }

  /* mergeData(){


     if(this.markets && this.watchDogs){
       let markets = this.markets;


       let time = new Date().toLocaleTimeString();
       let errors:string[] =[]

       let ar:WatchDog[] = this.watchDogs;
     /!*  ar.forEach(function (item) {
         let market = markets[item.symbol];
         if(market){
           if(!item.marketHistory)item.marketHistory =[];
           else  item.marketHistory.push(item.market);
           if(item.marketHistory.length>100)item.marketHistory.shift();



           if(!item.price_usd_history) item.price_usd_history = [];
           else item.price_usd_history.push({
                 time:item.time,
                 value:item.price_usd
               });
           if(item.price_usd_history.length>100) item.price_usd_history.shift();

           item.time = time;
           item.market = market;
           item.price_usd = market.price_usd;
           item.rank = market.rank;
           item.percent_change_1h = market.percent_change_1h;
           item.percent_change_24h = market.percent_change_24h;
           item.percent_change_7d = market.percent_change_7d;

         }else errors.push('Error:12345 No Marlet for '+item.symbol);

       })*!/
       this.seconds = 30;

       setTimeout(()=>this.runAnalytics(), 500);

       //this.watchDogs  = _.orderBy(ar, this.sortCriteria, this.asc_desc);
     }*/
  //}


}
