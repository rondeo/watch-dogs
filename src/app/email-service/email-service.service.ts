import { Injectable } from '@angular/core';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import * as _ from 'lodash';
import {AuthHttpService, VOUser} from '../services/auth-http.service';

import {VOMarketCap, WatchDog} from '../models/app-models';
import {StorageService} from '../services/app-storage.service';
import {MarketCapService} from '../market-cap/market-cap.service';




@Injectable()
export class EmailServiceService {

  private watchDogs:WatchDog[];
  private watchDogsSub:BehaviorSubject<WatchDog[]>;
  watchDogs$:Observable<WatchDog[]>;

  currentWatchDog :WatchDog;

  constructor(
    private http:AuthHttpService,
    private storage:StorageService,
    public marketCap:MarketCapService
  ) {

    this.watchDogsSub = new BehaviorSubject(this.watchDogs);
    this.watchDogs$ = this.watchDogsSub.asObservable();
    this.currentWatchDog = this.getNewWatchDog();

    this.marketCap.coinsAr$.subscribe( res=>{
      if(!res) return;
      this.marketCapData = this.marketCap.coins;
      this.mapMarketCap();
    })


  }

  getNewWatchDog():WatchDog{
  return {
    uid: '',
    coinId: '',
    dogName: '',
    status: 'fa-battery-empty',
    marketCap: {
      id: '',
      name: '',
      symbol: '',
      rank: 0,
      price_usd: 0,
      percent_change_1h: 0,
      percent_change_24h: 0,
      percent_change_7d: 0
    }
  }
  }
  saveData(){
    let data = this.watchDogs.map(function (item) {
      let script = item.scriptText;
      if(script && script.length < 50) script = '';

    return {
      uid:item.uid,
      coinId:item.coinId,
      dogName:item.dogName,
      status:item.status,
      description:item.description,
      scriptText:script
    }
  });

    this.storage.setItem('watch-dogs',JSON.stringify(data));
    this.watchDogsSub.next(this.watchDogs);
  }

  marketCapData:{[id:string]:VOMarketCap}



  getWatchDogs():WatchDog[]{

    if(!this.watchDogs){
      let str = this.storage.getItem('watch-dogs');

      let ar = [];

      if(str){
        try {
          ar = JSON.parse(str);

        }catch (e){
          console.error(e);
        }


      }
      this.marketCap.refresh();
      this.watchDogs = ar;
    }
    return this.watchDogs;
    //console.log('getWatchDogs');



  // if(!this.watchDogs){

  }


  mapMarketCap(){

    let data = this.marketCap.getAllCoinsById();

    let ar = this.watchDogs;
    console.log(ar);
    //console.log('email service marketCap.getAllCoinsById');
    ar.forEach(function (item) {

      item.scriptIcon = item.scriptText?'fa fa-battery-full':'fa fa-battery-empty';
      item.statusIcon = item.status !=='active'?'fa fa-play':'fa fa-pause';
      item.marketCap = data[item.coinId];

      if(!item.marketCap) console.error('cant find ' + item.coinId);
    });

    this.watchDogs = ar
    this.watchDogsSub.next(this.watchDogs);


  }

 /* static mergeData(markets, ar:WatchDog[]){

    ar.forEach(function (item) {

      let market = markets[item.coinId];




    })
    //this.watchDogs  = _.orderBy(ar, this.sortCriteria, this.asc_desc);

  }*/


 addDog(dog:WatchDog){
   dog.scriptIcon = dog.scriptText?'fa fa-battery-full':'fa fa-battery-empty';
   dog.statusIcon = dog.status !=='active'?'fa fa-play':'fa fa-pause';
   dog.marketCap = this.marketCapData[dog.coinId];
   if(!dog.marketCap){
     console.error(' cant find  '+dog.coinId);
     return;
   }
   this.watchDogs.push(dog);
   this.watchDogsSub.next(this.watchDogs);
 }

  /*editDog(dog:WatchDog){
    if(!dog) return;
    console.log(dog);

   // this.getDogByUid(dog.uid).subscribe(res=>{
     // console.log(res);
     //if(!res) {
       dog.marketCap =  this.data[dog.coinId];


     //}
     this.saveData();
   //});
  }*/



  createUid(symbol:string):string{
   let indexed = _.keyBy(this.watchDogs, 'uid')
    let i=0;
    while(indexed[symbol +'_'+ (++i)]);
    return symbol +'_' + i;
  }


  deleteDog(dog: WatchDog) {
    this.watchDogs = _.filter(this.watchDogs,function (item) {
      return item.uid !==dog.uid;
    });
    this.saveData();
    this.watchDogsSub.next(this.watchDogs);

  }


  getDogByUid(uid: string):WatchDog {

    return this.getWatchDogs().find((item)=>{
          return item.uid === uid;
      });

   /* console.warn(uid);
    let sub:Subject<WatchDog> | BehaviorSubject<WatchDog>;
    if(!this.watchDogs){




      sub =  new Subject();
      this.getWatchDogs().subscribe((dogs)=>{
        console.log(dogs);
        if(!dogs) return;
        sub.next(this._getDogByUid(uid));
      })

    }else {
      sub = new BehaviorSubject(this._getDogByUid(uid));
    }

    return sub.asObservable();*/

   /* return this.getWatchDogs().switchMap((dogs)=>{
      return dogs.find(function (item) {
        return item.uid === uid
      })
    })*/
  }


  sendNotification(subject:string, message: string):Observable<any> {

    if(this.http.isLogedIn()){
      let url ='/api/send-notification';
      let payload ={
        email:this.http.getUserEmail(),
        subject:subject,
        message:message
      };

      console.log(' sendNotification ' + url, payload);
      return this.http.post(url, payload).map(res=>res);
    }else{
      let sub:BehaviorSubject<any> = new BehaviorSubject({error:'login',message:'Please login into email service'})
      return sub.asObservable();
    }
  }
}
