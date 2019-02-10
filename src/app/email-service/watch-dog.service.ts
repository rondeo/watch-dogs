import {Injectable} from '@angular/core';
import {AuthHttpService} from '../core/services/auth-http.service';

import {VOWatchdog} from '../models/app-models';

import {StorageService} from '../core/services/app-storage.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Observable} from 'rxjs/internal/Observable';



@Injectable()
export class WatchDogService {


  constructor(
    private auth: AuthHttpService,
    private storage: StorageService
  ) {

    this.watchDogsSub = new BehaviorSubject(null);
  }

  private watchDogsSub: BehaviorSubject<VOWatchdog[]>;


  private isloading: boolean;
  private email: string;

  watchdogs$(): Observable<VOWatchdog[]> {
    let wd = this.watchDogsSub.getValue();
    if (!wd) this.refreshWatchdogs();
    return this.watchDogsSub.asObservable();
  }

  async refreshWatchdogs() {
    if (this.isloading) return;

    const sellCoins: VOWatchdog[] = <VOWatchdog[]>await this.storage.getWatchDogs();
    this.watchDogsSub.next(sellCoins);



   // console.log('query ');
   // const dogs =  await this.storage.select(SELL_COINS);
  //  console.log(dogs);

   // this.watchDogsSub.next(dogs);

  /*  let url = '/api/watchdogs/my';

    this.auth.get(url).toPromise().then(res => {
      this.email = res.email;
      console.log(res)
      if (res && res.result) {
        let data = res.result;
        let scriptsActive: VOWatchdog[] = JSON.parse(res.result.scriptsActive || '[]');
        let scriptsUnactive: VOWatchdog[] = JSON.parse(res.result.scriptsUnactive || '[]');
        let emailActive: VOWatchdog[] = JSON.parse(res.result.emailActive || '[]');
        let emailUnactive: VOWatchdog[] = JSON.parse(res.result.emaulAnactive || '[]');

        let dogs = scriptsActive.concat(scriptsUnactive).concat(emailActive).concat(emailUnactive);
        this.watchDogsSub.next(dogs);
      }

      if(res.message ==='Please login'){
        this.auth.autoLogin().subscribe(res =>{
          console.warn(res);
        })



      }


    }).catch(err => {
      console.error(err);
    })*/
  }

  async saveWatchDog(watchDog: VOWatchdog): Promise<any> {
    let dogs: VOWatchdog[] = this.watchDogsSub.getValue();
    if (!dogs) dogs = [];
    let exists: VOWatchdog = dogs.find(function (item) {
      return item.id === watchDog.id;
    });
    if (!exists) {
      dogs.push(watchDog);
      this.watchDogsSub.next(dogs);
    }

   return this.storage.saveWatchDogs(dogs);

  }


 /* async saveWatchDogs(): Promise<any> {
    let dogs: VOWatchdog[] = this.watchDogsSub.getValue() || [];

    dogs = dogs.map(function (item) {
      return {
        id: item.id,
        coin: item.coin,
        name: item.name,
        percent_change_1hLess: item.percent_change_1hLess,
        percent_change_1h: item.percent_change_1h,
        active: item.active,
        exchange: item.exchange,
        base: item.base,
        script: item.script,
        status: item.status,
        isEmail: item.isEmail

      };
    });*/
   // return this.storage.upsert(SELL_COINS, dogs);



   /* let email = this.email;

    let scriptsActive = dogs.filter(function (item) {
      return item.active && !item.isEmail
    });

    let scriptsUnactive = dogs.filter(function (item) {
      return !item.active && !item.isEmail
    });

    let emailActive = dogs.filter(function (item) {
      return item.active && item.isEmail
    });

    let emailUnactive = dogs.filter(function (item) {
      return !item.active && item.isEmail
    });

    let url = '/api/watchdogs/save';

    return this.auth.post(url, {email, scriptsActive, scriptsUnactive, emailActive, emailUnactive})*/
 // }

  async deleteWatchdog(dog: VOWatchdog): Promise<any> {
    let dogs: VOWatchdog[] = this.watchDogsSub.getValue();

    for (let i = dogs.length - 1; i >= 0; i--) {
      if (dogs[i].id === dog.id) dogs.splice(i, 1);
    }
    this.watchDogsSub.next(dogs);

    return this.storage.saveWatchDogs(dogs);
  }
}
