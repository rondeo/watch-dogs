import {Injectable} from '@angular/core';
import {VOMarketCap, VOWatchdog} from '../models/app-models';
import * as CryptoJS from 'crypto-js';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import * as localforage from 'localforage';
import * as _ from 'lodash';
import {ExchangeLogin} from './user-login.service';


@Injectable()
export class StorageService {

  static instance: StorageService;

  readonly WATCH_DOGS = 'WATCH_DOGS';
  //email:string;
  email: string;
  //password:string;
  private simplePass = 'watch dogs password';

  private salt: string;
  //isLogedIn$:Observable<boolean>;
  // private isLogedInSub:BehaviorSubject<boolean>;

  constructor() {
    StorageService.instance = this;
    //this.isLogedInSub = new BehaviorSubject(false);
    ///this.isLogedIn$ = this.isLogedInSub.asObservable();
    this.lastVisitedUrl = localStorage.getItem('lastVisitedUrl');
  }



  /*isLoggedIn():boolean{
    return  this.isLogedInSub.getValue();
  }*/
  async storeUserSimple(email: string, password: string):Promise<void> {
    let user = CryptoJS.HmacSHA1('user', this.simplePass).toString();
    let data = JSON.stringify({u: email, p: password});
    data = CryptoJS.AES.encrypt(data, this.simplePass).toString();
    return Promise.resolve(localStorage.setItem(user, data));
  }

  async restoreUserSimple(): Promise< { u: string, p: string }> {
    let user = CryptoJS.HmacSHA1('user', this.simplePass).toString();
    let item = localStorage.getItem(user);
    if (!item) return null;
    item = CryptoJS.AES.decrypt(item, this.simplePass).toString(CryptoJS.enc.Utf8);
    return Promise.resolve(JSON.parse(item));
  }

  /* filterSelected(coins: VOMarketCap[]): VOMarketCap[] {
     let selected = this.getSelectedMC();
     return coins.filter(function (item) {
       return selected.indexOf(item.symbol) !== -1;
     })
   }*/

  /* mapSelected(coins: any) {
     let selected = this.getSelectedMC();
     coins.forEach(function (item) {
       item.selected = selected.indexOf(item.symbol) !== -1;
     })
   }*/


  getSelectedMC() {
    if (this.selectedMC) return Promise.resolve(this.selectedMC);
    else return this.select('market-cap-selected').then(res => this.selectedMC = res || []);
  }

  getEmail(): string {
    return this.email;
  }

  hashPassword2(password: string): string {
    return CryptoJS.SHA256(CryptoJS.SHA256(password).toString()).toString();
  }

  hashPassword1(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  isSaltSub: BehaviorSubject<string> = new BehaviorSubject(null);

  setSalt(email: string, salt: string) {
    this.email = email;
    this.salt = salt;
    //console.log('set salt ' + salt);
    this.isSaltSub.next(salt);
    // this.salt = CryptoJS.HmacSHA1(password, this.simplePass).toString();
    //console.log(' salt ' + this.salt);
  }

  onSalt(): Observable<string> {
    return this.isSaltSub.asObservable();
  }

  removeSalt() {
    this.salt = null;
    this.isSaltSub.next(null);
    ;
  }

  selectedMC: string[];

  async addMCSelected(symbol: string) {
    let ar = this.selectedMC;
    if (ar.indexOf(symbol) == -1) ar.push(symbol);
    this.saveSelectedMC();
  }

  async deleteSelectedMC(symbol: string) {
    let ar = this.selectedMC;
    for (let i = ar.length - 1; i >= 0; i--) if (ar[i] === symbol) ar.splice(i, 1);
    return this.saveSelectedMC();
  }

  private watchDogs: VOWatchdog[];

  async upsertWatchDog(wd: VOWatchdog) {
    const exists = await this.getWatchDogByID(wd.id);
    if (!exists) this.watchDogs.push(wd);
    return this.saveWatchDogs();
  }

  async getWatchDogByID(id: string) {
    const wd = await this.getWatchDogs();
    return _.find(wd, {id: id});
  }

  async getWatchDogs(): Promise<VOWatchdog[]> {
    if (this.watchDogs) return Promise.resolve(this.watchDogs);
    else return this.select(this.WATCH_DOGS).then(res => {
      this.watchDogs = res || [];
      return this.watchDogs;
    })
  }

  async saveWatchDogs(watchDogs:VOWatchdog[] = null) {
    if (watchDogs) this.watchDogs = watchDogs;
    if (this.watchDogs) return this.upsert(this.WATCH_DOGS, this.watchDogs);
    else throw new Error('no watchdogs to save');
  }

  async upsert(index: string, item: any): Promise<any> {
    return localforage.setItem(index, item);
  }

  async select(index: string): Promise<any> {
    return localforage.getItem(index);
  }

  async remove(index: string): Promise<any>{
    return localforage.removeItem(index);
  }

  //////////////////////////////////////////////////////////////////////////////
  async saveSelectedMC() {
    return this.upsert('market-cap-selected', this.selectedMC);
    // localStorage.setItem('market-cap-selected', JSON.stringify(this.selected));
  }

  async getItem(s: string, secure = false): Promise<string> {
    if (secure) {
      if (!this.salt) {
        let user =  await this.restoreUserSimple();
        if (user) this.setSalt(user.u, user.p)
        else {
          console.error('application-login');
         // alert('Please login in Application');

          return Promise.reject('application-login');
        }
      }
      s = CryptoJS.HmacSHA1(s, this.salt).toString();
      // console.log(s);

      let str = localStorage.getItem(s)

      if (str) return Promise.resolve(CryptoJS.AES.decrypt(str, this.salt).toString(CryptoJS.enc.Utf8));
      else return  Promise.resolve(null)
    } else s = CryptoJS.HmacSHA1(s, this.simplePass).toString();
    return Promise.resolve(localStorage.getItem(s));
  }

  async setItem(s: string, data: string, secure = false) {
    //  console.log('save', data);
    if (secure) {
      if (!this.salt) {
        alert('Please login in Application');
        return Promise.reject('application-login');
      }
      data = CryptoJS.AES.encrypt(data, this.salt).toString();
      s = CryptoJS.HmacSHA1(s, this.salt).toString();
    } else s = CryptoJS.HmacSHA1(s, this.simplePass).toString();
    return Promise.resolve(localStorage.setItem(s, data));
  }

  removeItem(s: string, secure = false) {
    if (secure) {
      if (!this.salt) {
        alert('Please login in Application');
        return;
      }
      s = CryptoJS.HmacSHA1(s, this.salt).toString();
    } else s = CryptoJS.HmacSHA1(s, this.simplePass).toString();
    return localStorage.removeItem(s);
  }

  setLastVisitedUrl(url) {
    this.lastVisitedUrl = url;
    localStorage.setItem('lastVisitedUrl', url);
  }

  private lastVisitedUrl: string;

  getLastVisitedUrl() {
    return this.lastVisitedUrl;
  }
}

/*

const algorithmCTR = 'aes-256-ctr',
  algorithmGSM= 'aes-256-gcm';

export function encryptCTR(text){
 let  PASSWORD = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
  var cipher = crypto.createCipher(algorithmCTR, PASSWORD)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}


export function decryptCTR(text){
  let PASSWORD = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'
  var decipher = crypto.createDecipher(algorithmCTR,PASSWORD);
  var dec;
  try{
    dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
  }catch(e){
    console.error(e);
  }

  return dec;
}*/
