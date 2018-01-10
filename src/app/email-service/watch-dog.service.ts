import { Injectable } from '@angular/core';
import {AuthHttpService} from "../services/auth-http.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {VOWatchdog} from "../models/app-models";
import {Observable} from "rxjs/Observable";
import {StorageService} from "../services/app-storage.service";

@Injectable()
export class WatchDogService {

  private watchDogsSub:BehaviorSubject<VOWatchdog[]>;


  constructor(
    private auth:AuthHttpService,
    private storage:StorageService
  ) {

    this.watchDogsSub = new BehaviorSubject(null);
  }

  watchdogs$():Observable<VOWatchdog[]>{
   //let wd = this.watchDogsSub.getValue();
   // if(!wd) this.loadWatchdogs()
    return this.watchDogsSub.asObservable();
  }


  private isloading:boolean;
  refreshWatchdogs() {
    if(this.isloading) return;

    let url = '/api/watchdogs/my';
    this.auth.get(url).toPromise().then(res=>{
      console.log(res)

      if(res && res.result){
        let data = res.result;
        let scripts:VOWatchdog[] = JSON.parse(res.result.scriptsActive)
       // console.log(scripts);

        let unactive:VOWatchdog[] = JSON.parse(res.result.scriptsUnactive);
        let dogs = scripts.concat(unactive)
        this.watchDogsSub.next(dogs);
      }




    }).catch(err=>{
      console.error(err);
    })
  }

  saveWatchDog(watchDog: VOWatchdog):Observable<any> {
    let dogs:VOWatchdog[] = this.watchDogsSub.getValue();
    if(!dogs)dogs =[];
    let exists:VOWatchdog = dogs.find(function (item) {
      return item.id === watchDog.id;
    })
    if(!exists){
      dogs.push(watchDog);
      this.watchDogsSub.next(dogs);
    }

    return this.saveWatchDogs();
  }

  saveWatchDogs():Observable<any>{
    let dogs:VOWatchdog[] = this.watchDogsSub.getValue() || [];
    dogs = dogs.map(function (item) {
      return{
        id:item.id,
        coin:item.coin,
        name:item.name,
        percent_change_1hLess:item.percent_change_1hLess,
        percent_change_1h:item.percent_change_1h,
        active:item.active
      };
    });

    let email = this.auth.getUserEmail();

    let active = dogs.filter(function (item) {
      return item.active;
    });

    let unactive  = dogs.filter(function (item) {
      return !item.active
    })
    console.log(email);

    let url = '/api/watchdogs/save';

    return this.auth.post(url, {email:email, scriptsActive:active, scriptsUnactive:unactive})
  }

  deleteWatchdog(dog: VOWatchdog):Observable<any> {
    let dogs:VOWatchdog[] = this.watchDogsSub.getValue();

    for(let i = dogs.length - 1; i>=0; i--){
      if(dogs[i].id === dog.id) dogs.splice(i,1);
    }
    this.watchDogsSub.next(dogs);
    return this.saveWatchDogs();

  }
}
